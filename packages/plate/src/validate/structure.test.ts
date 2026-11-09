import { readFileSync } from "node:fs";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { readCorpusFile } from "#plate/document/corpus.ts";
import { readSource } from "#plate/document/read.ts";
import {
  attr,
  doc,
  el,
  entity,
  mathmlNamespace,
  qtiNamespace,
  ssmlNamespace,
  text,
  walk as walkDocument,
  xmlNamespace,
  xincludeNamespace,
  xmlnsNamespace,
  xsdNamespace,
  xsiNamespace,
} from "#plate/document/source.ts";
import type {
  SourceAttribute,
  SourceChild,
  SourceDocument,
  SourceElement,
} from "#plate/document/source.ts";
import { packageTables } from "#plate/package/tables.ts";
import {
  cpuMillis,
  growthFactor,
  growthLimit,
  growthRatio,
  growthRuns,
} from "#plate/test/growth.ts";
import type { Location, RefusalRule } from "#plate/validate/refusal.ts";
import { checkStructure, governingTables } from "#plate/validate/structure.ts";
import { tables as generatedTables } from "#plate/validate/tables.ts";
import type {
  AttributeTable,
  AttributeType,
  BuiltinName,
  ChildName,
  ElementTable,
  Tables,
  TypeEntry,
  Wildcard,
} from "#plate/validate/xsd.ts";
import { manifestNamespace } from "#plate/vocabulary.ts";

/**
 * The location every hand-built document in these tests carries.
 */
const location = "items/structure.xml";

/**
 * A namespace no table names, for elements and attributes a wildcard may admit.
 */
const otherNamespace = "urn:example:other";

/**
 * Construct a built-in attribute type.
 *
 * @param name The built-in's name.
 * @param minInclusive The lower bound's lexical form, when the type has one.
 * @returns The type.
 */
const builtin = (name: BuiltinName, minInclusive?: string): AttributeType =>
  minInclusive === undefined ? { kind: "builtin", name } : { kind: "builtin", minInclusive, name };

/**
 * Construct an enumeration of NCNames, as the XSD's vocabularies are.
 *
 * @param values The values it admits.
 * @returns The type.
 */
const oneOf = (...values: readonly string[]): AttributeType => ({
  base: "NCName",
  kind: "enumeration",
  values,
});

/**
 * Construct an optional attribute's table.
 *
 * @param local The attribute's local name.
 * @param type Its type.
 * @param namespace Its namespace, none by default.
 * @returns The table.
 */
const optional = (local: string, type: AttributeType, namespace = ""): AttributeTable => ({
  local,
  namespace,
  type,
  use: "optional",
});

/**
 * Construct a required attribute's table.
 *
 * @param local The attribute's local name.
 * @param type Its type.
 * @returns The table.
 */
const required = (local: string, type: AttributeType): AttributeTable => ({
  local,
  namespace: "",
  type,
  use: "required",
});

/**
 * Construct an element's table, element-only and admitting nothing unless told otherwise.
 *
 * @param fields The fields that differ from an empty table.
 * @returns The table.
 */
const element = (fields: Partial<ElementTable> = {}): ElementTable => ({
  attributes: [],
  children: [],
  global: false,
  text: false,
  types: [],
  ...fields,
});

/**
 * Name QTI-namespace children.
 *
 * @param locals Their local names.
 * @returns Their child names.
 */
const qti = (...locals: readonly string[]): readonly ChildName[] =>
  locals.map((local) => ({ local, namespace: qtiNamespace }));

/**
 * The lax attribute wildcard of the XSD's HTML elements, `extensionAnyTypeLax.Attr`.
 */
const anyLax: Wildcard = { namespace: "##any", process: "lax" };

/**
 * The lax wildcard of the XSD's `extensionNamespaceLax` groups.
 */
const otherLax: Wildcard = { namespace: "##other", process: "lax" };

/**
 * An identifier's type.
 */
const ncName = builtin("NCName");

/**
 * The type of a double.
 */
const double = builtin("double");

/**
 * The type of a declaration's `base-type`.
 */
const baseType = oneOf("identifier", "integer", "float", "string");

/**
 * The type of a count the XSD leaves unbounded.
 */
const nonNegative = builtin("nonNegativeInteger");

/**
 * The type of `figures` on `qti-round-to` and `qti-equal-rounded`: an integer, or an NCName naming
 * a template variable (XSD:27126-27134).
 */
const figuresType: AttributeType = {
  kind: "union",
  members: [
    builtin("integer"),
    { base: "string", kind: "pattern", pattern: String.raw`[\i-[:]][\c-[:]]*` },
  ],
};

/**
 * A small slice of the QTI tables, hand-built: an item, its declarations with their mappings,
 * tables and values, its processing, a catalog, and a body with an HTML paragraph and image,
 * interactions and the PCI module list.
 */
const tables: Tables = {
  elements: {
    img: element({
      anyAttribute: anyLax,
      attributes: [optional("aria-keyshorts", builtin("string"))],
    }),
    p: element({
      anyAttribute: anyLax,
      attributes: [optional("id", ncName)],
      children: qti("qti-gap", "qti-text-entry-interaction"),
      text: true,
    }),
    "qti-assessment-item": element({
      attributes: [
        optional("lang", builtin("string"), xmlNamespace),
        optional("adaptive", builtin("boolean")),
        required("identifier", builtin("string")),
        optional("time-dependent", builtin("boolean")),
        optional("title", builtin("normalizedString")),
      ],
      children: qti(
        "qti-catalog-info",
        "qti-item-body",
        "qti-outcome-declaration",
        "qti-response-declaration",
        "qti-response-processing",
        "qti-template-processing",
      ),
    }),
    "qti-base-value": element({ attributes: [required("base-type", baseType)], text: true }),
    "qti-card": element({ children: qti("qti-card-entry", "qti-file-href", "qti-html-content") }),
    "qti-card-entry": element({ children: qti("qti-file-href", "qti-html-content") }),
    "qti-catalog": element({ attributes: [required("id", ncName)], children: qti("qti-card") }),
    "qti-catalog-info": element({ children: qti("qti-catalog") }),
    "qti-choice-interaction": element({
      attributes: [
        optional("max-choices", nonNegative),
        optional("min-choices", nonNegative),
        required("response-identifier", ncName),
      ],
      children: qti("qti-simple-choice"),
    }),
    "qti-correct-response": element({ children: qti("qti-value") }),
    "qti-default-value": element({ children: qti("qti-value") }),
    "qti-extended-text-interaction": element({
      attributes: [optional("max-strings", nonNegative), required("response-identifier", ncName)],
    }),
    "qti-file-href": element({ text: true }),
    "qti-gap": element({ attributes: [required("identifier", ncName)] }),
    "qti-gap-match-interaction": element({
      attributes: [required("response-identifier", ncName)],
      children: qti("p", "qti-gap-text"),
    }),
    "qti-gap-text": element({
      attributes: [required("identifier", ncName), required("match-max", nonNegative)],
      children: qti("qti-gap"),
      text: true,
    }),
    "qti-graphic-gap-match-interaction": element({
      attributes: [required("response-identifier", ncName)],
      children: qti("qti-gap-text"),
    }),
    "qti-html-content": element({ anyElement: anyLax, text: true }),
    "qti-interaction-markup": element({ anyElement: anyLax, text: true }),
    "qti-interaction-modules": element({
      attributes: [
        optional("primary-configuration", builtin("anyURI")),
        optional("secondary-configuration", builtin("anyURI")),
      ],
    }),
    "qti-item-body": element({
      children: [
        { local: "math", namespace: mathmlNamespace },
        ...qti(
          "img",
          "p",
          "qti-choice-interaction",
          "qti-extended-text-interaction",
          "qti-gap-match-interaction",
          "qti-graphic-gap-match-interaction",
          "qti-interaction-modules",
          "qti-media-interaction",
          "qti-order-interaction",
          "qti-portable-custom-interaction",
          "qti-slider-interaction",
          "qti-undefined",
        ),
      ],
    }),
    "qti-map-entry": element({
      attributes: [
        required("map-key", builtin("normalizedString")),
        required("mapped-value", double),
      ],
    }),
    "qti-mapping": element({
      attributes: [
        optional("default-value", double),
        optional("lower-bound", double),
        optional("upper-bound", double),
      ],
      children: qti("qti-map-entry"),
    }),
    "qti-match-table": element({
      attributes: [optional("default-value", builtin("string"))],
      children: qti("qti-match-table-entry"),
    }),
    "qti-match-table-entry": element({
      attributes: [
        required("source-value", builtin("int")),
        required("target-value", builtin("string")),
      ],
    }),
    "qti-media-interaction": element({
      attributes: [optional("max-plays", nonNegative), required("response-identifier", ncName)],
    }),
    "qti-number-correct": element({ attributes: [optional("section-identifier", ncName)] }),
    "qti-order-interaction": element({
      attributes: [optional("min-choices", nonNegative), required("response-identifier", ncName)],
      children: qti("qti-simple-choice"),
    }),
    "qti-outcome-declaration": element({
      attributes: [
        optional("base-type", baseType),
        required("cardinality", oneOf("single", "multiple", "ordered", "record")),
        required("identifier", ncName),
        optional("normal-maximum", builtin("double", "0.0")),
        optional("view", { item: oneOf("author", "candidate", "scorer"), kind: "list" }),
      ],
      children: qti("qti-default-value", "qti-match-table"),
    }),
    "qti-outcome-processing": element({ children: qti("qti-set-outcome-value") }),
    "qti-portable-custom-interaction": element({
      anyAttribute: otherLax,
      anyElement: otherLax,
      attributes: [required("response-identifier", ncName)],
      children: qti("qti-interaction-markup"),
    }),
    "qti-repeat": element({ children: qti("qti-base-value", "qti-repeat") }),
    "qti-response-declaration": element({
      attributes: [
        optional("base-type", baseType),
        required("cardinality", oneOf("single", "multiple", "ordered", "record")),
        required("identifier", ncName),
      ],
      children: qti("qti-correct-response", "qti-default-value", "qti-mapping"),
    }),
    "qti-response-processing": element({ children: qti("qti-set-outcome-value") }),
    "qti-round-to": element({
      attributes: [required("figures", figuresType)],
      children: qti("qti-base-value"),
    }),
    "qti-set-outcome-value": element({
      attributes: [required("identifier", ncName)],
      children: qti("qti-number-correct", "qti-repeat", "qti-round-to"),
    }),
    "qti-simple-choice": element({ attributes: [required("identifier", ncName)], text: true }),
    "qti-slider-interaction": element({
      attributes: [
        required("lower-bound", double),
        required("response-identifier", ncName),
        required("upper-bound", double),
      ],
    }),
    "qti-template-condition": element({ children: qti("qti-template-if") }),
    "qti-template-constraint": element({ children: qti("qti-base-value") }),
    "qti-template-if": element({ children: qti("qti-template-constraint") }),
    "qti-template-processing": element({
      children: qti("qti-template-condition", "qti-template-constraint"),
    }),
    "qti-text-entry-interaction": element({
      attributes: [
        optional("expected-length", nonNegative),
        required("response-identifier", ncName),
      ],
    }),
    "qti-value": element({ text: true }),
  },
  types: {},
};

/**
 * Construct an item holding the given children, with only its required `identifier`.
 *
 * @param children The item's children.
 * @param attributes The item's attributes.
 * @returns The item as a source document.
 */
const item = (
  children: readonly SourceChild[],
  attributes: readonly SourceAttribute[] = [attr("identifier", "item")],
): SourceDocument => doc(location, el("qti-assessment-item", attributes, children));

/**
 * Construct an item whose body holds the given children.
 *
 * @param children The body's children.
 * @returns The item as a source document.
 */
const body = (...children: readonly SourceChild[]): SourceDocument =>
  item([el("qti-item-body", [], children)]);

/**
 * Construct a response declaration holding a mapping with one map entry.
 *
 * @param base The declaration's base type.
 * @param entry The map entry's attributes.
 * @returns The declaration.
 */
const mapped = (base: string, entry: readonly SourceAttribute[]) =>
  el(
    "qti-response-declaration",
    [attr("identifier", "RESPONSE"), attr("cardinality", "single"), attr("base-type", base)],
    [el("qti-mapping", [], [el("qti-map-entry", entry)])],
  );

/**
 * Construct an outcome declaration holding a match table with one entry.
 *
 * @param base The declaration's base type.
 * @param target The entry's `target-value`.
 * @returns The declaration.
 */
const matched = (base: string, target: string) =>
  el(
    "qti-outcome-declaration",
    [attr("identifier", "TOTAL"), attr("cardinality", "single"), attr("base-type", base)],
    [
      el(
        "qti-match-table",
        [],
        [el("qti-match-table-entry", [attr("source-value", "1"), attr("target-value", target)])],
      ),
    ],
  );

/**
 * A path location.
 *
 * @param path The element or attribute path.
 * @returns The location.
 */
const at = (path: string): Location => ({ kind: "path", path });

/**
 * Check a document against {@link tables} and keep each refusal's rule and location.
 *
 * @param source The document.
 * @param against The tables to check it against.
 * @returns The refusals' rules and locations, in the order they were found.
 */
const found = (
  source: SourceDocument,
  against: Tables = tables,
): readonly (readonly [RefusalRule, Location])[] =>
  checkStructure(source, against).map((refusal) => [refusal.rule, refusal.location] as const);

/**
 * Check each value of one attribute against a type, and keep the values it refuses.
 *
 * Each value sits alone on a one-element document whose table declares only that attribute.
 *
 * @param type The attribute's type.
 * @param values The values to check.
 * @returns The values that yield a refusal, in the given order.
 */
const refusedValues = (type: AttributeType, values: readonly string[]): readonly string[] =>
  values.filter(
    (value) =>
      checkStructure(doc(location, el("probe", [attr("value", value)])), {
        elements: { probe: element({ attributes: [optional("value", type)] }) },
        types: {},
      }).length > 0,
  );

/**
 * Check a document against {@link tables} and keep the first refusal.
 *
 * @param source The document.
 * @param against The tables to check it against.
 * @returns The first refusal, if any.
 */
const first = (source: SourceDocument, against: Tables = tables) =>
  checkStructure(source, against)[0];

/**
 * Construct an outcome declaration of base type float with one more attribute.
 *
 * @param attribute The attribute under test.
 * @param children The declaration's children.
 * @returns The declaration.
 */
const outcome = (attribute: SourceAttribute, children: readonly SourceChild[] = []) =>
  el(
    "qti-outcome-declaration",
    [
      attr("identifier", "SCORE"),
      attr("cardinality", "single"),
      attr("base-type", "float"),
      attribute,
    ],
    children,
  );

/**
 * Construct a `qti-value` holding a value.
 *
 * @param written The value's text.
 * @returns The element.
 */
const value = (written: string) => el("qti-value", [], [text(written)]);

/**
 * Construct an item whose response processing sets one outcome from the given expression.
 *
 * @param expression The expression.
 * @returns The item as a source document.
 */
const processed = (expression: SourceChild): SourceDocument =>
  item([
    el(
      "qti-response-processing",
      [],
      [el("qti-set-outcome-value", [attr("identifier", "SCORE")], [expression])],
    ),
  ]);

/**
 * The path of the expression {@link processed} sets.
 */
const setOutcome = "qti-assessment-item/qti-response-processing/qti-set-outcome-value";

/**
 * A `qti-mapping` with one map entry.
 */
const mapping = el(
  "qti-mapping",
  [],
  [el("qti-map-entry", [attr("map-key", "A"), attr("mapped-value", "1")])],
);

/**
 * A `qti-area-mapping` with one circle.
 */
const areaMapping = el(
  "qti-area-mapping",
  [],
  [
    el("qti-area-map-entry", [
      attr("shape", "circle"),
      attr("coords", "10,10,5"),
      attr("mapped-value", "1"),
    ]),
  ],
);

/**
 * Construct an item, whole by the generated tables, whose one response declaration holds a mapping.
 *
 * @param cardinality The declaration's cardinality.
 * @param base The declaration's base type, none for a record.
 * @param held The mapping it holds.
 * @returns The item as a source document.
 */
const mappingItem = (
  cardinality: string,
  base: Option.Option<string>,
  held: SourceElement,
): SourceDocument =>
  item(
    [
      el(
        "qti-response-declaration",
        [
          attr("identifier", "RESPONSE"),
          attr("cardinality", cardinality),
          ...Option.match(base, {
            onNone: () => [],
            onSome: (written) => [attr("base-type", written)],
          }),
        ],
        [held],
      ),
    ],
    [attr("identifier", "item"), attr("title", "Item"), attr("time-dependent", "false")],
  );

/**
 * Check a mapping item against the generated tables, keeping each refusal's rule, location and
 * detail.
 *
 * @param source The item.
 * @returns Its refusals.
 */
const judgedMapping = (source: SourceDocument) =>
  checkStructure(source, generatedTables).map((refusal) => ({
    detail: refusal.detail,
    location: refusal.location,
    rule: refusal.rule,
  }));

/**
 * The refusal of a mapping that a {@link mappingItem}'s response declaration cannot hold.
 *
 * @param local The mapping's local name.
 * @param requires Where the mapping must sit, as the placement row words it.
 * @returns The refusal's rule, location and detail.
 */
const misplacedMapping = (
  local: string,
  requires: string,
): readonly {
  detail: Readonly<Record<string, string>>;
  location: Location;
  rule: RefusalRule;
}[] => [
  {
    detail: { element: local, requires },
    location: at(`qti-assessment-item/qti-response-declaration/${local}`),
    rule: "misplaced-element",
  },
];

/**
 * Where a `qti-mapping` must sit, as its placement row words it.
 */
const mappable =
  "in a qti-response-declaration whose base type is neither file nor duration and whose cardinality is not record";

/**
 * Where a `qti-area-mapping` must sit, as its placement row words it.
 */
const pointed =
  "in a qti-response-declaration whose base type is point and whose cardinality is not record";

/**
 * Construct an item whose catalog holds one card.
 *
 * @param children The card's children.
 * @returns The item as a source document.
 */
const carded = (...children: readonly SourceChild[]): SourceDocument =>
  item([
    el(
      "qti-catalog-info",
      [],
      [el("qti-catalog", [attr("id", "glossary")], [el("qti-card", [], children)])],
    ),
  ]);

/**
 * Construct an item whose body holds one PCI with the given children.
 *
 * @param children The PCI's children.
 * @returns The item as a source document.
 */
const customInteraction = (...children: readonly SourceChild[]): SourceDocument =>
  body(el("qti-portable-custom-interaction", [attr("response-identifier", "RESPONSE")], children));

/**
 * Construct an item with one identifier response declaration whose correct response holds the
 * given values.
 *
 * @param cardinality The declaration's cardinality.
 * @param values The correct response's children.
 * @returns The item as a source document.
 */
const corrected = (cardinality: string, ...values: readonly SourceChild[]): SourceDocument =>
  item([
    el(
      "qti-response-declaration",
      [
        attr("identifier", "RESPONSE"),
        attr("cardinality", cardinality),
        attr("base-type", "identifier"),
      ],
      [el("qti-correct-response", [], values)],
    ),
  ]);

/**
 * Construct an item with one single float outcome declaration whose default value holds the given
 * values.
 *
 * @param values The default value's children.
 * @returns The item as a source document.
 */
const defaulted = (...values: readonly SourceChild[]): SourceDocument =>
  item([outcome(attr("normal-maximum", "1"), [el("qti-default-value", [], values)])]);

/**
 * Construct an item whose body holds one choice interaction with the given `max-choices`.
 *
 * @param count The `max-choices` value.
 * @returns The item as a source document.
 */
const choosing = (count: string): SourceDocument =>
  body(
    el("qti-choice-interaction", [
      attr("response-identifier", "RESPONSE"),
      attr("max-choices", count),
    ]),
  );

/**
 * Construct an item whose response processing rounds to the given `figures`.
 *
 * @param figures The `figures` value.
 * @returns The item as a source document.
 */
const rounded = (figures: string): SourceDocument =>
  processed(el("qti-round-to", [attr("figures", figures)]));

/**
 * Construct a document whose root is a `qti-time-limits` with the given `max-time`.
 *
 * @param maxTime The `max-time` as written.
 * @returns The document.
 */
const limits = (maxTime: string): SourceDocument =>
  doc(location, el("qti-time-limits", [attr("max-time", maxTime)]));

/**
 * The detail reading 46 gives a `count-range` refusal.
 *
 * @param attribute The attribute's name.
 * @param lexical The value refused.
 * @returns The detail.
 */
const rangeDetail = (attribute: string, lexical: string) => ({
  attribute,
  greatest: "9223372036854775807",
  least: "-9223372036854775808",
  lexical,
  reading: "46",
});

/**
 * Construct a document whose root is one expression element with the given attributes, to check
 * against the generated tables.
 *
 * @param name The element's local name.
 * @param attributes Its attributes.
 * @returns The document.
 */
const literal = (name: string, ...attributes: readonly SourceAttribute[]): SourceDocument =>
  doc(location, el(name, attributes));

/**
 * Construct a document whose root is a `qti-repeat` of one integer operand (reading 21), repeated
 * the given times.
 *
 * @param numberRepeats The `number-repeats` as written.
 * @returns The document.
 */
const repeated = (numberRepeats: string): SourceDocument =>
  doc(
    location,
    el(
      "qti-repeat",
      [attr("number-repeats", numberRepeats)],
      [el("qti-base-value", [attr("base-type", "integer")], [text("1")])],
    ),
  );

/**
 * The detail of an `attribute-type` refusal of a `figures` below the information model's floor for
 * its rounding mode.
 *
 * @param rounding The rounding element's local name.
 * @param written The `figures` refused, as written.
 * @param roundingMode The mode in force, written or the default.
 * @param line The information model's line that sets the floor.
 * @returns The detail.
 */
const figuresDetail = (
  rounding: string,
  written: string,
  roundingMode: "decimalPlaces" | "significantFigures",
  line: string,
) => {
  const least = roundingMode === "significantFigures" ? "1" : "0";

  return {
    attribute: "figures",
    element: rounding,
    expected: `an integer at least ${least} when rounding-mode is ${roundingMode}`,
    least,
    source: line,
    value: written,
    whenAttribute: "rounding-mode",
    whenValue: roundingMode,
  };
};

/**
 * Name a type in the QTI namespace.
 *
 * @param local The type's local name.
 * @returns Its name.
 */
const qtiType = (local: string): ChildName => ({ local, namespace: qtiNamespace });

/**
 * Name an XML Schema built-in type.
 *
 * @param local The type's local name.
 * @returns Its name.
 */
const xsdType = (local: string): ChildName => ({ local, namespace: xsdNamespace });

/**
 * The namespace declarations the `xsi:type` tests write: `q` for QTI's namespace and `xs` for XML
 * Schema's.
 */
const declarations: readonly SourceAttribute[] = [
  attr("q", qtiNamespace, xmlnsNamespace),
  attr("xs", xsdNamespace, xmlnsNamespace),
];

/**
 * Construct a document whose root carries {@link declarations} and an `xsi:type`.
 *
 * @param name The root's local name.
 * @param written The `xsi:type` as written.
 * @param children The root's children, none by default.
 * @param attributes The root's other attributes, none by default.
 * @returns The document.
 */
const typed = (
  name: string,
  written: string,
  children: readonly SourceChild[] = [],
  attributes: readonly SourceAttribute[] = [],
): SourceDocument =>
  doc(
    location,
    el(name, [...declarations, attr("type", written, xsiNamespace), ...attributes], children),
  );

/**
 * The attributes `WeightDType` requires, which a `qti-null` typed `WeightDType` carries, because
 * that type's table governs it (AD-9).
 */
const weightAttributes: readonly SourceAttribute[] = [attr("identifier", "W"), attr("value", "1")];

/**
 * Construct a response processing whose root carries the given namespace declarations and holds a
 * `qti-null`, two levels down, with an `xsi:type`.
 *
 * @param scope The root's namespace declarations.
 * @param written The `xsi:type` as written.
 * @param attributes The `qti-null`'s other attributes, none by default.
 * @returns The document.
 */
const nestedNull = (
  scope: readonly SourceAttribute[],
  written: string,
  attributes: readonly SourceAttribute[] = [],
): SourceDocument =>
  doc(
    location,
    el("qti-response-processing", scope, [
      el(
        "qti-set-outcome-value",
        [attr("identifier", "SCORE")],
        [el("qti-null", [attr("type", written, xsiNamespace), ...attributes])],
      ),
    ]),
  );

/**
 * The path of the `xsi:type` of a root element.
 *
 * @param name The root's local name.
 * @returns The attribute's path.
 */
const typePath = (name: string): string => `${name}/@{${xsiNamespace}}type`;

/**
 * Follow a QTI type's bases through the committed tables.
 *
 * @param local The type's local name.
 * @returns The local names of the type and each QTI type it derives from, nearest first.
 */
const ancestry = (local: string): readonly string[] => {
  const names: string[] = [];
  let current: string | undefined = local;
  while (current !== undefined && !names.includes(current)) {
    names.push(current);

    const entry: TypeEntry | undefined = generatedTables.types[current];
    current =
      entry !== undefined && "base" in entry && entry.base.namespace === qtiNamespace
        ? entry.base.local
        : undefined;
  }

  return names;
};

/**
 * What a type's entry derives from and how, without its own table, as `tables.test.ts` compares
 * an entry's derivation.
 *
 * @param entry The type's entry.
 * @returns Its base and derivation, or its derivation and members for a union.
 */
const derivationOf = (entry: TypeEntry) =>
  entry.derivation === "union"
    ? { derivation: entry.derivation, members: entry.members }
    : { base: entry.base, derivation: entry.derivation };

/**
 * The table fields of a hand-built type entry that admits nothing: no attributes, no children and
 * no text.
 */
const noContent = { attributes: [], children: [], text: false } as const;

/**
 * The path of the `qti-null` {@link governedNull} types.
 */
const governedPath = "qti-assessment-item/qti-response-processing/qti-set-outcome-value/qti-null";

/**
 * Construct an item whose response processing sets `SCORE` from a `qti-null` carrying an
 * `xsi:type`, with `qti` bound to QTI's namespace on the item.
 *
 * @param written The `xsi:type` as written.
 * @param attributes The `qti-null`'s other attributes.
 * @returns The item as a source document.
 */
const governedNull = (written: string, attributes: readonly SourceAttribute[]): SourceDocument =>
  doc(
    location,
    el(
      "qti-assessment-item",
      [
        attr("qti", qtiNamespace, xmlnsNamespace),
        attr("identifier", "item"),
        attr("time-dependent", "false"),
        attr("title", "Governed"),
      ],
      [
        el(
          "qti-response-processing",
          [],
          [
            el(
              "qti-set-outcome-value",
              [attr("identifier", "SCORE")],
              [el("qti-null", [attr("type", written, xsiNamespace), ...attributes])],
            ),
          ],
        ),
      ],
    ),
  );

/**
 * Find the element of a document at a path.
 *
 * @param source The document.
 * @param path The element's path.
 * @returns The element; the test fails when no element has that path.
 */
const elementAt = (source: SourceDocument, path: string): SourceElement =>
  [...walkDocument(source)].find((visit) => visit.path === path)?.element ??
  assert.fail(`No element at ${path}.`);

/**
 * Construct an item, valid by the committed tables, whose body holds one child.
 *
 * @param child The body's child.
 * @returns The item as a source document.
 */
const committedBody = (child: SourceChild): SourceDocument =>
  doc(
    location,
    el(
      "qti-assessment-item",
      [attr("identifier", "item"), attr("time-dependent", "false"), attr("title", "Lax")],
      [el("qti-item-body", [], [child])],
    ),
  );

/**
 * Construct an item whose body holds one custom interaction, whose `##any` `lax` element wildcard
 * admits the given children.
 *
 * @param children The custom interaction's children.
 * @returns The item as a source document.
 */
const customized = (...children: readonly SourceChild[]): SourceDocument =>
  committedBody(el("qti-custom-interaction", [attr("response-identifier", "RESPONSE")], children));

/**
 * The path of the custom interaction {@link customized} builds.
 */
const custom = "qti-assessment-item/qti-item-body/qti-custom-interaction";

/**
 * Construct an item whose body holds one PCI whose markup holds a `template`, whose `##any` `lax`
 * element wildcard admits the given children.
 *
 * @param children The template's children.
 * @returns The item as a source document.
 */
const templated = (...children: readonly SourceChild[]): SourceDocument =>
  committedBody(
    el(
      "qti-portable-custom-interaction",
      [
        attr("custom-interaction-type-identifier", "urn:example:pci"),
        attr("response-identifier", "RESPONSE"),
      ],
      [el("qti-interaction-markup", [], [el("template", [], children)])],
    ),
  );

/**
 * The path of the template {@link templated} builds.
 */
const markupTemplate =
  "qti-assessment-item/qti-item-body/qti-portable-custom-interaction/qti-interaction-markup/template";

/**
 * Construct a test of one part whose one section holds the given child.
 *
 * @param child The section's child.
 * @returns The test as a source document.
 */
const sectioned = (child: SourceElement): SourceDocument =>
  doc(
    location,
    el(
      "qti-assessment-test",
      [attr("identifier", "test"), attr("title", "Lax")],
      [
        el(
          "qti-test-part",
          [
            attr("identifier", "part"),
            attr("navigation-mode", "linear"),
            attr("submission-mode", "individual"),
          ],
          [
            el(
              "qti-assessment-section",
              [attr("identifier", "section"), attr("title", "Section"), attr("visible", "true")],
              [child],
            ),
          ],
        ),
      ],
    ),
  );

/**
 * Construct a test whose one section's `qti-ordering`, with its `##other` `lax` element wildcard,
 * holds the given children.
 *
 * @param children The ordering's children.
 * @returns The test as a source document.
 */
const ordered = (...children: readonly SourceChild[]): SourceDocument =>
  sectioned(el("qti-ordering", [], children));

/**
 * The path of the ordering {@link ordered} builds.
 */
const ordering = "qti-assessment-test/qti-test-part/qti-assessment-section/qti-ordering";

/**
 * Construct a test whose one section's `qti-selection`, with its `##other` `lax` element wildcard,
 * selects one child and holds the given children.
 *
 * @param children The selection's children.
 * @returns The test as a source document.
 */
const selected = (...children: readonly SourceChild[]): SourceDocument =>
  sectioned(el("qti-selection", [attr("select", "1")], children));

/**
 * The path of the selection {@link selected} builds.
 */
const selection = "qti-assessment-test/qti-test-part/qti-assessment-section/qti-selection";

/**
 * An `id` that is no `NCName`, which every table under test declares as one.
 */
const badId = attr("id", "1x");

/**
 * A `div` whose `id` is no `NCName`.
 */
const badDiv = el("div", [badId]);

/**
 * A simple choice, which `div`'s table neither names nor admits by a wildcard.
 */
const looseChoice = el("qti-simple-choice", [attr("identifier", "A")], [text("A")]);

/**
 * Report whether a committed element table declares `id` with a given built-in type.
 *
 * @param local The element's local name.
 * @param name The built-in, `ID` by default, the type the XSD's `UniqueIdentifierDType` restricts.
 * @returns Whether its table declares `id` with that type.
 */
const declaresId = (local: string, name: BuiltinName = "ID"): boolean =>
  generatedTables.elements[local]?.attributes.some(
    (attribute) =>
      attribute.local === "id" && attribute.type.kind === "builtin" && attribute.type.name === name,
  ) ?? false;

/**
 * The namespace of the hand-built tables {@link xTables} give another schema.
 */
const xNamespace = "urn:x";

/**
 * Name an element or a type in {@link xNamespace}.
 *
 * @param local Its local name.
 * @returns Its name.
 */
const xName = (local: string): ChildName => ({ local, namespace: xNamespace });

/**
 * Name an element of {@link xNamespace} as its path step does.
 *
 * @param local The element's local name.
 * @returns Its step.
 */
const xStep = (local: string): string => `{${xNamespace}}${local}`;

/**
 * What a `box` and its type `BoxType` admit: a required `name`, the child `part`, and the elements
 * of every namespace but {@link xNamespace} laxly.
 */
const boxContent = {
  anyElement: otherLax,
  attributes: [required("name", ncName)],
  children: [xName("part")],
  text: false,
};

/**
 * Hand-built tables for {@link xNamespace}: a global `box` declared with `BoxType`; a `part`,
 * declared only locally, with an optional `size` and text; a global `tag` with a lax attribute
 * wildcard and a declared `max-choices`; and `WideBoxType`, which extends `BoxType` with a `width`.
 */
const xTables: Tables = {
  elements: {
    box: element({ ...boxContent, global: true, types: [xName("BoxType")] }),
    part: element({ attributes: [optional("size", nonNegative)], text: true }),
    tag: element({
      anyAttribute: anyLax,
      attributes: [optional("max-choices", nonNegative)],
      global: true,
    }),
  },
  types: {
    BoxType: { ...boxContent, base: xsdType("anyType"), derivation: "restriction" },
    WideBoxType: {
      ...boxContent,
      attributes: [required("name", ncName), optional("width", nonNegative)],
      base: xName("BoxType"),
      derivation: "extension",
    },
  },
};

/**
 * The tables of other namespaces the walk is given: {@link xTables} for {@link xNamespace}.
 */
const others: ReadonlyMap<string, Tables> = new Map([[xNamespace, xTables]]);

/**
 * Check a document against QTI's tables and {@link others}, and keep each refusal's rule and
 * location.
 *
 * @param source The document.
 * @param against QTI's tables.
 * @returns The refusals' rules and locations, in the order they were found.
 */
const foundWith = (
  source: SourceDocument,
  against: Tables = tables,
): readonly (readonly [RefusalRule, Location])[] =>
  checkStructure(source, against, others).map(
    (refusal) => [refusal.rule, refusal.location] as const,
  );

/**
 * Construct a document whose root is a `box` of {@link xNamespace} named `b`, with `x` bound to
 * that namespace and {@link declarations} bound too.
 *
 * @param attributes The root's other attributes.
 * @returns The document.
 */
const xBox = (...attributes: readonly SourceAttribute[]): SourceDocument =>
  doc(
    location,
    el(
      "box",
      [attr("x", xNamespace, xmlnsNamespace), ...declarations, attr("name", "b"), ...attributes],
      [],
      xNamespace,
    ),
  );

/**
 * Each declaration element, with the line of the information model that keeps the built-in
 * variables' identifiers from it: the session variables' identifiers are reserved, and all item
 * variables share one namespace.
 */
const reservations = [
  ["qti-context-declaration", "info.txt:22603"],
  ["qti-outcome-declaration", "info.txt:12006"],
  ["qti-response-declaration", "info.txt:39226"],
  ["qti-template-declaration", "info.txt:45843"],
] as const;

/**
 * Construct a document whose root is a single identifier declaration.
 *
 * @param name The declaration's local name.
 * @param identifier Its `identifier`, as written.
 * @returns The document.
 */
const declaredAs = (name: string, identifier: string): SourceDocument =>
  literal(
    name,
    attr("identifier", identifier),
    attr("cardinality", "single"),
    attr("base-type", "identifier"),
  );

/**
 * Construct a document whose root is an absolute `qti-equal` with the given tolerance.
 *
 * @param tolerance The `tolerance`, as written.
 * @returns The document.
 */
const tolerated = (tolerance: string): SourceDocument =>
  literal("qti-equal", attr("tolerance-mode", "absolute"), attr("tolerance", tolerance));

/**
 * Construct a document whose root is a `qti-printed-variable` with the given `format`.
 *
 * @param format The `format`, as written.
 * @returns The document.
 */
const printed = (format: string): SourceDocument =>
  literal("qti-printed-variable", attr("identifier", "SCORE"), attr("format", format));

/**
 * The detail of a refused printed variable's `format` (reading 132).
 *
 * @param format The `format`, as written.
 * @returns The detail.
 */
const formatDetail = (format: string) => ({
  attribute: "format",
  check: "printf-format",
  element: "qti-printed-variable",
  expected:
    "a printf format: any text, %% for a percent sign, and conversions, each a %, then any of the flags #, 0, space, + and -, an optional width, an optional precision of a point and zero or more digits, and one of the codes E, e, f, G, g, r, R, i, o, X, x and d",
  reading: "132",
  value: format,
});

/**
 * The printed variable's `format` as readings 132 and 161 and the operator's P1 write it, a width
 * of any digits, kept as the oracle the check must agree with. Its flags and its width both match
 * `0`, so a refused `%`, a run of zeros and a letter that is no code backtracks over every split of
 * the run: quadratic time.
 */
const quadraticPrintfFormat = /^(?:[^%]|%%|%[#0 +-]*[0-9]*(?:\.[0-9]*)?[EefGgrRioXxd])*$/u;

/**
 * The characters the `format` agreement check builds its strings from: the percent sign, every
 * flag, the digits that start a width with and without a zero, the point, three codes, `d` among
 * them, and `q`, which is no code.
 */
const formatAlphabet = ["%", "#", "0", " ", "+", "-", "1", "9", ".", "f", "i", "d", "q"] as const;

/**
 * List every string of at most `length` characters over an alphabet, shortest first.
 *
 * @param alphabet The characters.
 * @param length The longest string's length.
 * @returns The strings, the empty one first.
 */
const stringsUpTo = (alphabet: readonly string[], length: number): readonly string[] => {
  const strings: string[] = [""];
  let shorter: readonly string[] = [""];
  for (let size = 1; size <= length; size += 1) {
    shorter = shorter.flatMap((prefix) => alphabet.map((character) => `${prefix}${character}`));
    for (const string of shorter) {
      strings.push(string);
    }
  }

  return strings;
};

/**
 * The zeros in the larger `format` the growth check refuses; the smaller holds
 * {@link growthFactor} times fewer.
 */
const formatZeros = 64_000;

/**
 * The `format` growth check refuses the larger format once and times each size three times. The
 * quadratic pattern took about 3.5 s on 64,000 zeros, so a failing check runs past vitest's default
 * of 5 s, and it should report its ratio, not a timeout.
 */
const formatGrowthTimeoutMs = 60_000;

/**
 * The `format` equivalence check judges 402,234 strings. It took about 0.75 s alone over 271,453 of
 * them and 6.9 s on a loaded machine, past vitest's default of 5 s, so it is given room to finish
 * there.
 */
const formatEquivalenceTimeoutMs = 60_000;

/**
 * Each outcome the information model types, with the base type it must have and the line that says
 * so: SCORE and MAXSCORE are floats, PASSED is a boolean.
 */
const typedOutcomes = [
  ["SCORE", "float", "info.txt:8478"],
  ["MAXSCORE", "float", "info.txt:8480"],
  ["PASSED", "boolean", "info.txt:8482"],
] as const;

/**
 * Construct a document whose root is an outcome declaration.
 *
 * @param identifier Its `identifier`, as written.
 * @param base Its `base-type`.
 * @param cardinality Its `cardinality`, `single` by default.
 * @returns The document.
 */
const outcomeAs = (identifier: string, base: string, cardinality = "single"): SourceDocument =>
  literal(
    "qti-outcome-declaration",
    attr("identifier", identifier),
    attr("cardinality", cardinality),
    attr("base-type", base),
  );

/**
 * Construct a single outcome declaration, to place inside a document.
 *
 * @param identifier Its `identifier`.
 * @param base Its `base-type`.
 * @returns The declaration.
 */
const outcomeOf = (identifier: string, base: string): SourceElement =>
  el("qti-outcome-declaration", [
    attr("identifier", identifier),
    attr("cardinality", "single"),
    attr("base-type", base),
  ]);

/**
 * Construct a test, a document whose root is `qti-assessment-test`, that holds only outcome
 * declarations.
 *
 * @param outcomes Its outcome declarations, in document order.
 * @returns The document.
 */
const testDeclaring = (outcomes: readonly SourceElement[]): SourceDocument =>
  doc(
    location,
    el("qti-assessment-test", [attr("identifier", "test"), attr("title", "Test")], outcomes),
  );

/**
 * The four kinds of variable declaration, each with a `cardinality` and a `base-type`.
 */
const variableKinds = [
  "qti-context-declaration",
  "qti-outcome-declaration",
  "qti-response-declaration",
  "qti-template-declaration",
] as const;

/**
 * Construct an outcome declaration of record cardinality.
 *
 * @param identifier Its `identifier`, as written.
 * @param base Its `base-type`, when it writes one.
 * @returns The declaration.
 */
const recordOutcome = (identifier: string, base?: string): SourceElement =>
  el("qti-outcome-declaration", [
    attr("identifier", identifier),
    attr("cardinality", "record"),
    ...(base === undefined ? [] : [attr("base-type", base)]),
  ]);

/**
 * The detail of the refusal of a typed outcome declared `record`, at its `cardinality`.
 *
 * @param identifier The outcome.
 * @param fixed The base type it must have.
 * @returns The detail.
 */
const reservedRecord = (identifier: string, fixed: string) => ({
  attribute: "cardinality",
  baseType: fixed,
  check: "reserved-outcome-type",
  element: "qti-outcome-declaration",
  expected: `single, multiple or ordered: an outcome named ${identifier} has the base type ${fixed}, and a record has none`,
  identifier,
  pantry: "ReservedOutcomeTypes",
  reading: "153",
  value: "record",
});

/**
 * The refusals below an item's root, checked against the generated tables: the hand-built item
 * writes none of its root's required attributes, which these tests do not judge.
 *
 * @param source The item.
 * @returns Each refusal below the root, with its rule, location and detail, in the order found.
 */
const declarationRefusals = (source: SourceDocument) =>
  checkStructure(source, generatedTables)
    .filter(
      (refusal) =>
        refusal.location.kind === "path" &&
        refusal.location.path.startsWith("qti-assessment-item/"),
    )
    .map((refusal) => [refusal.rule, refusal.location, refusal.detail] as const);

/**
 * The `attribute-type` refusals of a document checked against the generated tables, by
 * location.
 *
 * @param source The document.
 * @returns Each `attribute-type` refusal's location, in document order.
 */
const mistyped = (source: SourceDocument): readonly Location[] =>
  checkStructure(source, generatedTables)
    .filter((refusal) => refusal.rule === "attribute-type")
    .map((refusal) => refusal.location);

/**
 * Construct an item, whole by the generated tables, holding the given children: its root writes
 * the three attributes the tables require of it.
 *
 * @param children The item's children.
 * @returns The item as a source document.
 */
const wholeItem = (children: readonly SourceChild[]): SourceDocument =>
  item(children, [
    attr("identifier", "item"),
    attr("title", "Item"),
    attr("time-dependent", "false"),
  ]);

/**
 * An item whose body holds a paragraph around one `object` with the attributes the tables
 * require of it and the given others.
 *
 * @param attributes The object's other attributes.
 * @returns The item.
 */
const objectWith = (...attributes: readonly SourceAttribute[]): SourceDocument =>
  wholeItem([
    el(
      "qti-item-body",
      [],
      [
        el(
          "p",
          [],
          [el("object", [attr("data", "x.png"), attr("type", "image/png"), ...attributes])],
        ),
      ],
    ),
  ]);

/**
 * Where an attribute of {@link objectWith}'s object sits.
 *
 * @param name The attribute's name as its path step spells it.
 * @returns The location.
 */
const objectAttribute = (name: string): Location =>
  at(`qti-assessment-item/qti-item-body/p/object/@${name}`);

/**
 * Check a document against the generated tables, keeping each refusal's rule, location and detail.
 *
 * @param source The document.
 * @returns Its refusals, in the order found.
 */
const judged = (source: SourceDocument) =>
  checkStructure(source, generatedTables).map(
    (refusal) => [refusal.rule, refusal.location, refusal.detail] as const,
  );

/**
 * An image, as a graphic interaction or a position object stage holds one.
 */
const picture = el("img", [attr("alt", "A map"), attr("src", "map.png")]);

/**
 * Construct a hotspot of a graphic interaction: a `qti-hotspot-choice`, or a
 * `qti-associable-hotspot` with the `match-max` it requires.
 *
 * @param local The hotspot's local name.
 * @param identifier Its `identifier`.
 * @param geometry Its `shape`, as written.
 * @returns The hotspot.
 */
const hotspot = (local: string, identifier: string, geometry: string): SourceElement =>
  el(local, [
    attr("identifier", identifier),
    attr("shape", geometry),
    attr("coords", "10,10,5"),
    ...(local === "qti-associable-hotspot" ? [attr("match-max", "1")] : []),
  ]);

/**
 * Construct a whole item whose body holds one graphic interaction with an image and the given
 * children after it.
 *
 * @param interaction The interaction's local name.
 * @param children The interaction's children after its image: hotspots, and text between them.
 * @returns The item as a source document.
 */
const graphicItem = (interaction: string, ...children: readonly SourceChild[]): SourceDocument =>
  wholeItem([
    el(
      "qti-item-body",
      [],
      [el(interaction, [attr("response-identifier", "RESPONSE")], [picture, ...children])],
    ),
  ]);

/**
 * The detail of the refusal of a default hotspot out of its place (reading 80).
 *
 * @param local The hotspot's local name.
 * @param context The interaction that holds it.
 * @returns The detail.
 */
const defaultHotspot = (local: string, context: string) => ({
  check: "default-hotspot",
  context,
  element: local,
  reading: "80",
});

/**
 * The default hotspot choices of the smaller interaction the default hotspot growth check reads,
 * and the text runs after them; the larger holds {@link growthFactor} times as many of each.
 */
const fewerDefaultHotspots = 1000;

/**
 * The hotspot choices, and the text runs after them, of the hostile-size default hotspot case: the
 * size at which a scan of the interaction's children per default hotspot took over a second.
 */
const hostileDefaultHotspots = 16_000;

/**
 * The default hotspot growth check and hostile-size case check interactions of up to 16,000
 * hotspot choices and 16,000 text runs several times each. A scan of the children per default
 * hotspot took several seconds of that, past vitest's default of 5 s, and a failing case should
 * report its ratio, not a timeout.
 */
const hotspotGrowthTimeoutMs = 60_000;

/**
 * Construct a whole item whose hotspot interaction holds, after its image, a run of hotspot
 * choices of one shape and then as many text runs, each a line break. The reader keeps text that
 * comments keep apart as separate runs, so the runs are what a line break and a comment, repeated,
 * read as: no element follows the last hotspot, and every text run follows every hotspot.
 *
 * @param hotspots The hotspot choices, and the text runs after them.
 * @param geometry Each hotspot choice's `shape`, as written.
 * @returns The item as a source document.
 */
const crowdedHotspots = (hotspots: number, geometry: string): SourceDocument =>
  wholeItem([
    el(
      "qti-item-body",
      [],
      [
        el(
          "qti-hotspot-interaction",
          [attr("response-identifier", "RESPONSE")],
          [
            picture,
            ...Array.from({ length: hotspots }, (_, index) =>
              hotspot("qti-hotspot-choice", `H${index + 1}`, geometry),
            ),
            ...Array.from({ length: hotspots }, () => text("\n")),
          ],
        ),
      ],
    ),
  ]);

/**
 * The path of a hotspot choice of {@link crowdedHotspots}'s interaction.
 *
 * @param position Its 1-based position among the interaction's hotspot choices.
 * @returns Its location.
 */
const crowdedHotspot = (position: number): Location =>
  at(`qti-assessment-item/qti-item-body/qti-hotspot-interaction/qti-hotspot-choice[${position}]`);

/**
 * Construct a whole item whose body holds a position object stage with one position object
 * interaction.
 *
 * @param attributes The interaction's attributes beside its `response-identifier`.
 * @returns The item as a source document.
 */
const positioned = (...attributes: readonly SourceAttribute[]): SourceDocument =>
  wholeItem([
    el(
      "qti-item-body",
      [],
      [
        el(
          "qti-position-object-stage",
          [],
          [
            picture,
            el(
              "qti-position-object-interaction",
              [attr("response-identifier", "RESPONSE"), ...attributes],
              [picture],
            ),
          ],
        ),
      ],
    ),
  ]);

/**
 * Construct a whole item with one outcome declaration holding a lookup table.
 *
 * @param identifier The outcome's `identifier`.
 * @param cardinality Its `cardinality`, as written.
 * @param base Its `base-type`, none for a record.
 * @param table The lookup table.
 * @returns The item as a source document.
 */
const lookedUp = (
  identifier: string,
  cardinality: string,
  base: Option.Option<string>,
  table: SourceElement,
): SourceDocument =>
  wholeItem([
    el(
      "qti-outcome-declaration",
      [
        attr("identifier", identifier),
        attr("cardinality", cardinality),
        ...Option.match(base, {
          onNone: () => [],
          onSome: (written) => [attr("base-type", written)],
        }),
      ],
      [table],
    ),
  ]);

/**
 * A match table with one entry, as the research probe `p100-multiple-table` writes it.
 */
const matchTable = el(
  "qti-match-table",
  [attr("default-value", "0")],
  [el("qti-match-table-entry", [attr("source-value", "1"), attr("target-value", "1.5")])],
);

/**
 * An interpolation table with one entry.
 */
const interpolationTable = el(
  "qti-interpolation-table",
  [],
  [el("qti-interpolation-table-entry", [attr("source-value", "1"), attr("target-value", "1.5")])],
);

/**
 * The location of the lookup table a {@link lookedUp} item's outcome holds.
 *
 * @param local The table's local name.
 * @returns Its location.
 */
const lookupTable = (local: string): Location =>
  at(`qti-assessment-item/qti-outcome-declaration/${local}`);

/**
 * The detail of the refusal of a lookup table under an outcome that is not single (reading 100).
 *
 * @param local The table's local name.
 * @param identifier The outcome's identifier.
 * @returns The detail.
 */
const lookupCardinality = (local: string, identifier: string) => ({
  check: "lookup-cardinality",
  element: local,
  identifier,
  reading: "100",
});

/**
 * Check a document against the generated tables, keeping each refusal's rule and location.
 *
 * @param source The document.
 * @returns Its refusals' rules and locations, in the order found.
 */
const ruled = (source: SourceDocument) =>
  judgedMapping(source).map(({ location: where, rule }) => [rule, where]);

/**
 * An image, as a `picture` holds one after its sources.
 */
const pictureImage = el("img", [attr("alt", "A map"), attr("src", "map.png")]);

/**
 * Construct a whole item whose body holds the given content.
 *
 * @param content The body's children.
 * @returns The item as a source document.
 */
const bodied = (...content: readonly SourceChild[]): SourceDocument =>
  wholeItem([el("qti-item-body", [], content)]);

/**
 * The location of an element or attribute in a {@link bodied} item's body.
 *
 * @param step The path below the body.
 * @returns Its location.
 */
const inBody = (step: string): Location => at(`qti-assessment-item/qti-item-body/${step}`);

/**
 * Check a document against the generated tables, and keep each refusal's rule and location and
 * the reading its detail cites.
 *
 * @param source The document.
 * @returns Its refusals' rules, locations and readings, in the order found.
 */
const cited = (source: SourceDocument) =>
  judged(source).map(([rule, where, detail]) => [rule, where, detail["reading"]] as const);

/**
 * Construct a whole item whose body holds a video with one track.
 *
 * @param attributes The track's attributes beside its `src`.
 * @returns The item as a source document.
 */
const trackedVideo = (...attributes: readonly SourceAttribute[]): SourceDocument =>
  bodied(
    el("video", [attr("src", "clip.mp4")], [el("track", [attr("src", "en.vtt"), ...attributes])]),
  );

/**
 * LOM's namespace, whose elements a manifest's metadata holds.
 */
const lomNamespace = "http://ltsc.ieee.org/xsd/LOM";

/**
 * Construct a 3.0.0 manifest whose own LOM record holds one title string.
 *
 * @param language The string's `xml:lang`, as written.
 * @returns The manifest as a source document.
 */
const titledManifest = (language: string): SourceDocument =>
  doc(
    "imsmanifest.xml",
    el(
      "manifest",
      [attr("identifier", "M")],
      [
        el(
          "metadata",
          [],
          [
            el("schema", [], [text("QTI Package")], manifestNamespace),
            el("schemaversion", [], [text("3.0.0")], manifestNamespace),
            el(
              "lom",
              [],
              [
                el(
                  "general",
                  [],
                  [
                    el(
                      "title",
                      [],
                      [
                        el(
                          "string",
                          [attr("lang", language, xmlNamespace)],
                          [text("A test")],
                          lomNamespace,
                        ),
                      ],
                      lomNamespace,
                    ),
                  ],
                  lomNamespace,
                ),
              ],
              lomNamespace,
            ),
          ],
          manifestNamespace,
        ),
        el("organizations", [], [], manifestNamespace),
        el("resources", [], [], manifestNamespace),
      ],
      manifestNamespace,
    ),
  );

/**
 * Check a manifest as the manifest walk does: no QTI tables, and the 3.0.0 profile's tables of
 * every namespace it reaches.
 *
 * @param source The manifest.
 * @returns Its refusals.
 */
const walkedManifest = (source: SourceDocument) =>
  checkStructure(source, { elements: {}, types: {} }, packageTables.get("3.0.0"));

/**
 * The namespace of the AfA DRD that a content package's schema set imports, through the content
 * packaging extension.
 */
const drdNamespace = "http://www.imsglobal.org/xsd/qti/qtiv3p0/imsafa3p0drd_v1p0";

/**
 * The namespace of the AfA DRD 2.0, which no schema set of QTI 3.0 imports: an item's ASI XSD
 * imports no DRD (reading 81).
 */
const drdV2Namespace = "http://www.imsglobal.org/xsd/accessibility/drdv2p0";

/**
 * Name an element of a namespace other than QTI's as its path step does.
 *
 * @param namespace The element's namespace.
 * @param local The element's local name.
 * @returns Its step.
 */
const stepIn = (namespace: string, local: string): string => `{${namespace}}${local}`;

/**
 * Construct an item, valid by the committed tables, whose `qti-companion-materials-info` holds the
 * given children. Its content model ends in `grpStrict.any`, a `strict` `##other` element wildcard
 * that may repeat, after the particles that name the materials.
 *
 * @param children The companion materials' children.
 * @returns The item as a source document.
 */
const companioned = (...children: readonly SourceChild[]): SourceDocument =>
  doc(
    location,
    el(
      "qti-assessment-item",
      [attr("identifier", "item"), attr("time-dependent", "false"), attr("title", "Strict")],
      [el("qti-companion-materials-info", [], children)],
    ),
  );

/**
 * The path of the companion materials {@link companioned} builds.
 */
const companion = "qti-assessment-item/qti-companion-materials-info";

/**
 * Construct a `widget` of {@link otherNamespace}, which no table declares, with `o` bound to that
 * namespace and {@link declarations} bound too.
 *
 * @param attributes The widget's other attributes, its `xsi:type` among them where it has one.
 * @param children The widget's children.
 * @returns The widget.
 */
const foreignWidget = (
  attributes: readonly SourceAttribute[],
  ...children: readonly SourceChild[]
): SourceElement =>
  el(
    "widget",
    [attr("o", otherNamespace, xmlnsNamespace), ...declarations, ...attributes],
    children,
    otherNamespace,
  );

/**
 * The path step of a {@link foreignWidget}.
 */
const widgetStep = stepIn(otherNamespace, "widget");

/**
 * Construct an `xsi:type`.
 *
 * @param written The type as written.
 * @returns The attribute.
 */
const instanceType = (written: string): SourceAttribute => attr("type", written, xsiNamespace);

/**
 * Construct a 3.0.0 manifest whose own LOM record's `general` holds some children, and whose one
 * resource's one file has metadata that holds others. LOM's `general` ends in a `lax` `##other`
 * element wildcard, and a file's metadata, `FileMetadataDType`, is `grpStrict.any` alone, a
 * `strict` `##other` element wildcard.
 *
 * @param general The children of the LOM record's `general`.
 * @param file The children of the file's metadata.
 * @returns The manifest as a source document.
 */
const packaged = (general: readonly SourceChild[], file: readonly SourceChild[]): SourceDocument =>
  doc(
    "imsmanifest.xml",
    el(
      "manifest",
      [attr("identifier", "M")],
      [
        el(
          "metadata",
          [],
          [
            el("schema", [], [text("QTI Package")], manifestNamespace),
            el("schemaversion", [], [text("3.0.0")], manifestNamespace),
            el("lom", [], [el("general", [], general, lomNamespace)], lomNamespace),
          ],
          manifestNamespace,
        ),
        el("organizations", [], [], manifestNamespace),
        el(
          "resources",
          [],
          [
            el(
              "resource",
              [attr("identifier", "R"), attr("type", "imsqti_item_xmlv3p0")],
              [
                el(
                  "file",
                  [attr("href", "item.xml")],
                  [el("metadata", [], file, manifestNamespace)],
                  manifestNamespace,
                ),
              ],
              manifestNamespace,
            ),
          ],
          manifestNamespace,
        ),
      ],
      manifestNamespace,
    ),
  );

/**
 * The path of the LOM record's `general` {@link packaged} builds.
 */
const packagedGeneral = [
  stepIn(manifestNamespace, "manifest"),
  stepIn(manifestNamespace, "metadata"),
  stepIn(lomNamespace, "lom"),
  stepIn(lomNamespace, "general"),
].join("/");

/**
 * The path of the file's metadata {@link packaged} builds.
 */
const packagedFile = ["manifest", "resources", "resource", "file", "metadata"]
  .map((local) => stepIn(manifestNamespace, local))
  .join("/");

/**
 * Construct a `qti-physical-material`, a fresh element on each call.
 *
 * @returns The element.
 */
const physicalMaterial = (): SourceElement => el("qti-physical-material", [], [text("A ruler")]);

/**
 * Construct the DRD's `accessForAllResource`, whose content model ends in `grpStrict.any`, a
 * `strict` `##other` element wildcard that may repeat, after the particles that name its
 * properties.
 *
 * @param children Its children.
 * @returns The element.
 */
const accessForAll = (...children: readonly SourceChild[]): SourceElement =>
  el("accessForAllResource", [], children, drdNamespace);

/**
 * The path step of an {@link accessForAll}.
 */
const accessForAllStep = stepIn(drdNamespace, "accessForAllResource");

/**
 * The path of an ID/IDREF case's item body.
 */
const idBody = "qti-assessment-item/qti-item-body";

/**
 * The path of an ID/IDREF case's response processing.
 */
const idProcessing = "qti-assessment-item/qti-response-processing";

/**
 * The path of an ID/IDREF case's `qti-set-outcome-value`.
 */
const idSetting = `${idProcessing}/qti-set-outcome-value`;

/**
 * A response declaration of one identifier, `RESPONSE`, of base type string.
 */
const idResponse = el("qti-response-declaration", [
  attr("identifier", "RESPONSE"),
  attr("cardinality", "single"),
  attr("base-type", "string"),
]);

/**
 * A context declaration of one identifier, `CTX`.
 */
const idContext = el("qti-context-declaration", [
  attr("identifier", "CTX"),
  attr("cardinality", "single"),
  attr("base-type", "string"),
]);

/**
 * The outcome `SCORE`, which an ID/IDREF case's response processing sets.
 */
const idScore = el("qti-outcome-declaration", [
  attr("identifier", "SCORE"),
  attr("cardinality", "single"),
  attr("base-type", "float"),
]);

/**
 * Set `SCORE` to an expression, in an ID/IDREF case's response processing.
 *
 * @param expression The expression.
 * @returns The `qti-set-outcome-value`.
 */
const idSet = (expression: SourceElement): SourceElement =>
  el("qti-set-outcome-value", [attr("identifier", "SCORE")], [expression]);

/**
 * Construct an item, valid by the committed tables, for the ID/IDREF table's cases: its
 * declarations, a body, and a response processing holding the given rules when any are given. Its
 * root binds the prefix `q` to QTI's namespace, for an `xsi:type`.
 *
 * @param declared The item's declarations.
 * @param content The body's children.
 * @param processing The response processing's children, none for no response processing.
 * @returns The item as a source document.
 */
const idItem = (
  declared: readonly SourceElement[],
  content: readonly SourceChild[],
  processing: readonly SourceElement[] = [],
): SourceDocument =>
  doc(
    location,
    el(
      "qti-assessment-item",
      [
        attr("q", qtiNamespace, xmlnsNamespace),
        attr("identifier", "item"),
        attr("time-dependent", "false"),
        attr("title", "IDs"),
      ],
      [
        ...declared,
        el("qti-item-body", [], content),
        ...(processing.length > 0 ? [el("qti-response-processing", [], processing)] : []),
      ],
    ),
  );

/**
 * Check a document against the committed tables and keep each refusal's rule, location and detail.
 *
 * @param source The document.
 * @returns The refusals, in the order they were found.
 */
const idFound = (source: SourceDocument) =>
  checkStructure(source, generatedTables).map(
    (refusal) => [refusal.rule, refusal.location, refusal.detail] as const,
  );

/**
 * The detail of an `idref-target` refusal.
 *
 * @param on The element's name.
 * @param attribute The attribute's name.
 * @param token The token that names no ID.
 * @returns The detail.
 */
const idrefTarget = (on: string, attribute: string, token: string) => ({
  attribute,
  check: "idref-target",
  element: on,
  reading: "156",
  value: token,
});

/**
 * Construct the research probe `a84_null_textentry_idref`'s item: a `qti-null` typed
 * `TextEntryInteractionDType`, whose `response-identifier` is then an IDREF (reading 84).
 *
 * @param response The `response-identifier` as written.
 * @returns The item as a source document.
 */
const idNulled = (response: string): SourceDocument =>
  idItem(
    [idResponse, idScore],
    [el("p", [], [text("x")])],
    [
      idSet(
        el("qti-null", [
          attr("type", "q:TextEntryInteractionDType", xsiNamespace),
          attr("response-identifier", response),
        ]),
      ),
    ],
  );

/**
 * Construct the research probes `p109a`, `p109b` and `p109d`'s item: a `qti-exit-response` typed
 * `ImgDType`, which declares `id` of an ID type and admits other attributes by a lax wildcard.
 *
 * @param attributes The exit's attributes beside its type, `alt` and `src`.
 * @returns The item as a source document.
 */
const idExit = (...attributes: readonly SourceAttribute[]): SourceDocument =>
  idItem(
    [idScore],
    [el("p", [], [text("x")])],
    [
      el("qti-exit-response", [
        attr("type", "q:ImgDType", xsiNamespace),
        attr("alt", "a"),
        attr("src", "x.png"),
        ...attributes,
      ]),
    ],
  );

/**
 * Give a declaration another identifier.
 *
 * @param declaration The declaration.
 * @param identifier The identifier it declares instead.
 * @returns The declaration with that identifier.
 */
const renamed = (declaration: SourceElement, identifier: string): SourceElement => ({
  ...declaration,
  attributes: declaration.attributes.map((attribute) =>
    attribute.local === "identifier" ? attr("identifier", identifier) : attribute,
  ),
});

/**
 * Construct a manifest resource `R` of one item file, with the given dependencies.
 *
 * @param dependencies Its `dependency` elements.
 * @returns The resource.
 */
const idResource = (dependencies: readonly SourceElement[]): SourceElement =>
  el(
    "resource",
    [attr("identifier", "R"), attr("type", "imsqti_item_xmlv3p0"), attr("href", "items/r.xml")],
    [el("file", [attr("href", "items/r.xml")], [], manifestNamespace), ...dependencies],
    manifestNamespace,
  );

/**
 * Construct an ID/IDREF case's item whose body holds the given content and then a custom
 * interaction, whose `##any` `lax` element wildcard admits the given children.
 *
 * @param before The body's children before the custom interaction.
 * @param children The custom interaction's children.
 * @returns The item as a source document.
 */
const laxItem = (
  before: readonly SourceChild[],
  ...children: readonly SourceChild[]
): SourceDocument =>
  idItem(
    [idResponse],
    [...before, el("qti-custom-interaction", [attr("response-identifier", "RESPONSE")], children)],
  );

/**
 * An element of another namespace, which no table declares, so the walk passes over it laxly in
 * a custom interaction's content.
 *
 * @param local Its local name.
 * @param attributes Its attributes.
 * @returns The element.
 */
const laxWidget = (local: string, ...attributes: readonly SourceAttribute[]): SourceElement =>
  el(local, attributes, [text("w")], otherNamespace);

/**
 * The path of a {@link laxItem}'s custom interaction.
 */
const laxInteraction = `${idBody}/qti-custom-interaction`;

/**
 * The committed tables, with the custom interaction's element wildcard made `skip`, so its
 * content is never visited: no committed table holds a `skip` wildcard.
 */
const skipping: Tables = {
  ...generatedTables,
  elements: {
    ...generatedTables.elements,
    "qti-custom-interaction": {
      ...element(),
      ...generatedTables.elements["qti-custom-interaction"],
      anyElement: { namespace: "##any", process: "skip" },
    },
  },
};

/**
 * Construct a {@link laxItem} whose custom interaction holds one element of another namespace that
 * writes an `xml:lang`.
 *
 * @param language The `xml:lang`, as written.
 * @param attributes The element's attributes before it.
 * @returns The item as a source document.
 */
const laxLanguage = (language: string, ...attributes: readonly SourceAttribute[]): SourceDocument =>
  laxItem([], laxWidget("w", ...attributes, attr("lang", language, xmlNamespace)));

describe("checkStructure", () => {
  describe("the six rules", () => {
    it("[I-0] refuses an element its parent's table does not admit as unknown-element", () => {
      const source = item([el("qti-item-bodyy")]);

      assert.deepStrictEqual(found(source), [
        ["unknown-element", at("qti-assessment-item/qti-item-bodyy")],
      ]);
      assert.strictEqual(checkStructure(source, tables)[0]?.document, location);
    });

    it("[Q-2] refuses an attribute no table declares as unknown-attribute", () => {
      const source = body(
        el("qti-choice-interaction", [
          attr("response-identifier", "RESPONSE"),
          attr("orientationn", "vertical"),
        ]),
      );
      const [refusal] = checkStructure(source, tables);

      assert.deepStrictEqual(found(source), [
        [
          "unknown-attribute",
          at("qti-assessment-item/qti-item-body/qti-choice-interaction/@orientationn"),
        ],
      ]);
      assert.deepStrictEqual(refusal?.suggestion, Option.none());
      assert.deepStrictEqual(refusal?.detail, {
        attribute: "orientationn",
        element: "qti-choice-interaction",
      });
    });

    it("[Q-2] refuses an absent required attribute as missing-attribute at its element", () => {
      const source = body(el("qti-choice-interaction"));
      const [refusal] = checkStructure(source, tables);

      assert.deepStrictEqual(found(source), [
        ["missing-attribute", at("qti-assessment-item/qti-item-body/qti-choice-interaction")],
      ]);
      assert.deepStrictEqual(refusal?.detail, {
        attribute: "response-identifier",
        element: "qti-choice-interaction",
      });
    });

    it('[Q-2] refuses max-choices="x" as attribute-type', () => {
      const source = body(
        el("qti-choice-interaction", [
          attr("response-identifier", "RESPONSE"),
          attr("max-choices", "x"),
        ]),
      );

      assert.deepStrictEqual(found(source), [
        [
          "attribute-type",
          at("qti-assessment-item/qti-item-body/qti-choice-interaction/@max-choices"),
        ],
      ]);
    });

    it('[I-1] refuses mapped-value=" 1" as padded-attribute (reading 7)', () => {
      const source = item([
        mapped("identifier", [attr("map-key", "A"), attr("mapped-value", " 1")]),
      ]);
      const [refusal] = checkStructure(source, tables);

      assert.deepStrictEqual(found(source), [
        [
          "padded-attribute",
          at(
            "qti-assessment-item/qti-response-declaration/qti-mapping/qti-map-entry/@mapped-value",
          ),
        ],
      ]);
      assert.strictEqual(refusal?.detail["reading"], "7");
    });

    it("[Q-2] refuses text in an element-only element as text-not-allowed", () => {
      const source = body(
        el(
          "qti-choice-interaction",
          [attr("response-identifier", "RESPONSE")],
          [text("\n  Pick one\n")],
        ),
      );

      assert.deepStrictEqual(found(source), [
        ["text-not-allowed", at("qti-assessment-item/qti-item-body/qti-choice-interaction")],
      ]);
    });
  });

  describe("reading 7: the padded typed-value attributes", () => {
    it('[I-1] refuses map-key=" York" under an identifier response', () => {
      const source = item([
        mapped("identifier", [attr("map-key", " York"), attr("mapped-value", "1")]),
      ]);

      assert.deepStrictEqual(found(source), [
        [
          "padded-attribute",
          at("qti-assessment-item/qti-response-declaration/qti-mapping/qti-map-entry/@map-key"),
        ],
      ]);
    });

    it('[I-1] keeps map-key=" York" under a string response, whose whitespace is the value', () => {
      const source = item([
        mapped("string", [attr("map-key", " York"), attr("mapped-value", "1")]),
      ]);

      assert.deepStrictEqual(found(source), []);
    });

    it("[I-2] reads a match table entry's target-value under its outcome's base type", () => {
      const integer = item([matched("integer", " 1")]);

      assert.deepStrictEqual(found(integer), [
        [
          "padded-attribute",
          at(
            "qti-assessment-item/qti-outcome-declaration/qti-match-table/qti-match-table-entry/@target-value",
          ),
        ],
      ]);
      assert.deepStrictEqual(found(item([matched("string", " 1")])), []);
    });

    it('[I-0] keeps BG007\'s title="BG true false example ", a free-text attribute', () => {
      const source = item(
        [],
        [attr("identifier", "BG007"), attr("title", "BG true false example ")],
      );

      assert.deepStrictEqual(found(source), []);
    });

    it('[I-2] reads normal-maximum=" 1" as a collapsed double, never refused for padding', () => {
      const source = item([
        el("qti-outcome-declaration", [
          attr("identifier", "SCORE"),
          attr("cardinality", "single"),
          attr("base-type", "float"),
          attr("normal-maximum", " 1"),
        ]),
      ]);

      assert.deepStrictEqual(found(source), []);
    });

    it('[I-8] reads a slider\'s lower-bound=" 0" as a collapsed double, never refused for padding', () => {
      const source = body(
        el("qti-slider-interaction", [
          attr("response-identifier", "RESPONSE"),
          attr("lower-bound", " 0"),
          attr("upper-bound", "10"),
        ]),
      );

      assert.deepStrictEqual(found(source), []);
    });
  });

  describe("reading 11: the misspelling table", () => {
    it("[Q-31] suggests secondary-configuration for fallback-configuration on qti-interaction-modules", () => {
      const source = body(
        el("qti-interaction-modules", [attr("fallback-configuration", "modules/fallback.js")]),
      );
      const [refusal] = checkStructure(source, tables);

      assert.deepStrictEqual(found(source), [
        [
          "unknown-attribute",
          at("qti-assessment-item/qti-item-body/qti-interaction-modules/@fallback-configuration"),
        ],
      ]);
      assert.deepStrictEqual(refusal?.suggestion, Option.some("secondary-configuration"));
      assert.deepStrictEqual(refusal?.detail, {
        attribute: "fallback-configuration",
        element: "qti-interaction-modules",
        reading: "11",
      });
    });

    it("[Q-31] suggests nothing for fallback-configuration on another element", () => {
      const source = body(
        el(
          "p",
          [],
          [
            el("qti-text-entry-interaction", [
              attr("response-identifier", "RESPONSE"),
              attr("fallback-configuration", "modules/fallback.js"),
            ]),
          ],
        ),
      );
      const [refusal] = checkStructure(source, tables);

      assert.strictEqual(refusal?.rule, "unknown-attribute");
      assert.deepStrictEqual(refusal?.suggestion, Option.none());
    });
  });

  describe("the allowances (reading 1)", () => {
    it("[I-0] admits namespace declarations", () => {
      const source = item(
        [],
        [
          attr("xmlns", qtiNamespace, xmlnsNamespace),
          attr("xsi", xsiNamespace, xmlnsNamespace),
          attr("identifier", "item"),
        ],
      );

      assert.deepStrictEqual(found(source), []);
    });

    it("[I-0] admits xsi:schemaLocation, which the XSD declares nowhere", () => {
      const source = item(
        [],
        [
          attr("schemaLocation", `${qtiNamespace} imsqti_asiv3p0p1_v1p0.xsd`, xsiNamespace),
          attr("identifier", "item"),
        ],
      );

      assert.deepStrictEqual(found(source), []);
    });

    it("[I-0] admits indentation between the elements of an element-only element", () => {
      const source = item([text("\n  "), el("qti-item-body", [], [text("\n\t\r\n")]), text("\n")]);

      assert.deepStrictEqual(found(source), []);
    });

    it("[I-0] admits xml:lang, which the table records from its ref", () => {
      const source = item([], [attr("lang", "en", xmlNamespace), attr("identifier", "item")]);

      assert.deepStrictEqual(found(source), []);
    });

    it("[I-0] admits a BG007-shaped item with all four allowances", () => {
      const source = item(
        [
          text("\n  "),
          mapped("identifier", [attr("map-key", "true"), attr("mapped-value", "1")]),
          text("\n  "),
          el(
            "qti-item-body",
            [],
            [
              text("\n    "),
              el(
                "qti-choice-interaction",
                [attr("response-identifier", "RESPONSE"), attr("max-choices", "1")],
                [
                  text("\n      "),
                  el("qti-simple-choice", [attr("identifier", "true")], [text("True")]),
                  text("\n    "),
                ],
              ),
              text("\n  "),
            ],
          ),
          text("\n"),
        ],
        [
          attr("xmlns", qtiNamespace, xmlnsNamespace),
          attr("xsi", xsiNamespace, xmlnsNamespace),
          attr("schemaLocation", `${qtiNamespace} imsqti_asiv3p0p1_v1p0.xsd`, xsiNamespace),
          attr("identifier", "BG007"),
          attr("title", "BG true false example "),
          attr("adaptive", "false"),
          attr("time-dependent", "false"),
          attr("lang", "en-US", xmlNamespace),
        ],
      );

      assert.deepStrictEqual(found(source), []);
    });

    it("[Q-20] admits a response-identifier that matches no element's id", () => {
      const source = body(
        el(
          "p",
          [attr("id", "para")],
          [
            text("Answer: "),
            el("qti-text-entry-interaction", [attr("response-identifier", "RESPONSE")]),
          ],
        ),
      );

      assert.deepStrictEqual(found(source), []);
    });

    it("[I-8] never refuses an entity reference, even in an element-only element", () => {
      const source = body(
        el("qti-choice-interaction", [attr("response-identifier", "RESPONSE")], [entity("nbsp")]),
      );

      assert.deepStrictEqual(found(source), []);
    });

    it("[Q-2] does not type-check an attribute that holds an unexpanded entity reference", () => {
      const source = body(
        el("qti-choice-interaction", [
          attr("response-identifier", "RESPONSE"),
          attr("max-choices", "&count;", "", ["count"]),
        ]),
      );

      assert.deepStrictEqual(found(source), []);
    });
  });

  describe("wildcards", () => {
    it("[I-8] admits data-x and onclick on a p whose table has an ##any attribute wildcard", () => {
      const source = body(el("p", [attr("data-x", "1"), attr("onclick", "alert(1)")]));

      assert.deepStrictEqual(found(source), []);
    });

    it("[Q-2] refuses data-x and onclick on an element with no attribute wildcard", () => {
      const source = body(
        el("qti-choice-interaction", [
          attr("response-identifier", "RESPONSE"),
          attr("data-x", "1"),
          attr("onclick", "alert(1)"),
        ]),
      );
      const choice = "qti-assessment-item/qti-item-body/qti-choice-interaction";

      assert.deepStrictEqual(found(source), [
        ["unknown-attribute", at(`${choice}/@data-x`)],
        ["unknown-attribute", at(`${choice}/@onclick`)],
      ]);
    });

    it("[Q-31] reads ##other as another namespace, never QTI's or none", () => {
      const pci = "qti-assessment-item/qti-item-body/qti-portable-custom-interaction";
      const source = body(
        el(
          "qti-portable-custom-interaction",
          [
            attr("response-identifier", "RESPONSE"),
            attr("module", "fractions", otherNamespace),
            attr("data-module", "fractions"),
          ],
          [
            el("qti-interaction-markup"),
            el(
              "markup",
              [attr("anything", "goes")],
              [el("deeper", [], [text("x")])],
              otherNamespace,
            ),
            el("markup", [], [], ""),
            el("qti-undefined"),
          ],
        ),
      );

      assert.deepStrictEqual(found(source), [
        ["unknown-attribute", at(`${pci}/@data-module`)],
        ["unknown-element", at(`${pci}/{}markup`)],
        ["unknown-element", at(`${pci}/qti-undefined`)],
      ]);
    });

    it("[I-8] matches a wildcard's namespace list, with none written as an empty string", () => {
      const listed: Tables = {
        elements: {
          ...tables.elements,
          "qti-item-body": element({
            anyAttribute: { namespace: ["", otherNamespace], process: "strict" },
            anyElement: { namespace: [otherNamespace], process: "lax" },
          }),
        },
        types: {},
      };
      const source = item([
        el(
          "qti-item-body",
          [
            attr("plain", "1"),
            attr("foreign", "1", otherNamespace),
            attr("lang", "en", xmlNamespace),
          ],
          [el("listed", [], [], otherNamespace), el("unlisted", [], [], mathmlNamespace)],
        ),
      ]);

      assert.deepStrictEqual(found(source, listed), [
        ["unknown-attribute", at("qti-assessment-item/qti-item-body/@xml:lang")],
        ["unknown-element", at(`qti-assessment-item/qti-item-body/{${mathmlNamespace}}unlisted`)],
      ]);
    });

    it("[I-8] admits an element of no namespace under an ##any element wildcard, and does not walk it", () => {
      const open: Tables = {
        elements: { ...tables.elements, "qti-item-body": element({ anyElement: anyLax }) },
        types: {},
      };
      const source = body(el("div", [attr("any", "thing")], [el("qti-undefined")], ""));

      assert.deepStrictEqual(found(source, open), []);
    });

    it("[I-8] does not walk a MathML element the table admits by name", () => {
      const source = body(
        el(
          "math",
          [attr("display", "block")],
          [el("mi", [attr("unknown", "x")], [text("x")], mathmlNamespace)],
          mathmlNamespace,
        ),
      );

      assert.deepStrictEqual(found(source), []);
    });
  });

  describe("elements", () => {
    it("[I-8] refuses an admitted QTI-namespace child with no table, and does not walk it", () => {
      const source = body(el("qti-undefined", [attr("x", "1")], [el("qti-also-undefined")]));

      assert.deepStrictEqual(found(source), [
        ["unknown-element", at("qti-assessment-item/qti-item-body/qti-undefined")],
      ]);
    });

    it("[I-0] refuses a QTI-namespace root with no table", () => {
      const source = doc(location, el("qti-assessment-itemm", [], [el("qti-item-body")]));

      assert.deepStrictEqual(found(source), [["unknown-element", at("qti-assessment-itemm")]]);
    });

    it("[I-0] leaves a root outside the QTI namespace to the verdict", () => {
      const source = doc(location, el("html", [], [el("body")], ""));

      assert.deepStrictEqual(found(source), []);
    });

    it("[Q-2] refuses a declared attribute the type prohibits as unknown-attribute", () => {
      const prohibiting: Tables = {
        elements: {
          ...tables.elements,
          "qti-choice-interaction": element({
            attributes: [
              { local: "max-choices", namespace: "", type: builtin("int"), use: "prohibited" },
              required("response-identifier", ncName),
            ],
          }),
        },
        types: {},
      };
      const source = body(
        el("qti-choice-interaction", [
          attr("response-identifier", "RESPONSE"),
          attr("max-choices", "1"),
        ]),
      );

      assert.deepStrictEqual(found(source, prohibiting), [
        [
          "unknown-attribute",
          at("qti-assessment-item/qti-item-body/qti-choice-interaction/@max-choices"),
        ],
      ]);
    });
  });

  describe("attribute types", () => {
    it('[Q-2] reads max-choices=" 1", a nonNegativeInteger, collapsed', () => {
      const source = body(
        el("qti-choice-interaction", [
          attr("response-identifier", "RESPONSE"),
          attr("max-choices", " 1"),
        ]),
      );

      assert.deepStrictEqual(found(source), []);
    });

    it("reads a boolean as true, false, 1 or 0", () => {
      assert.deepStrictEqual(
        refusedValues(builtin("boolean"), ["true", "false", "1", "0", " true\n", "yes", "TRUE"]),
        ["yes", "TRUE"],
      );
    });

    it("reads the integer kinds exactly, with int's 32-bit range and nonNegativeInteger's 0", () => {
      assert.deepStrictEqual(
        refusedValues(builtin("integer"), [
          "0",
          "+7",
          "-7",
          "123456789012345678901234567890",
          "1.0",
          "1e3",
          "",
        ]),
        ["1.0", "1e3", ""],
      );
      assert.deepStrictEqual(
        refusedValues(builtin("int"), [
          "2147483647",
          "-2147483648",
          "2147483648",
          "-2147483649",
          "+0002147483647",
        ]),
        ["2147483648", "-2147483649"],
      );
      assert.deepStrictEqual(
        refusedValues(builtin("nonNegativeInteger"), [
          "0",
          "-0",
          "+3",
          "9223372036854775808000",
          "-1",
          "x",
        ]),
        ["-1", "x"],
      );
    });

    it("reads a decimal and a double in XML Schema's lexical spaces", () => {
      assert.deepStrictEqual(
        refusedValues(builtin("decimal"), ["1.5", "-.5", "1.", "+2", "1e3", ".", "INF"]),
        ["1e3", ".", "INF"],
      );
      assert.deepStrictEqual(
        refusedValues(double, ["1e3", "-1.5E-2", ".5", "INF", "-INF", "NaN", "1,5", "inf", "+INF"]),
        ["1,5", "inf", "+INF"],
      );
    });

    it("reads an NCName and admits anything as a string, a URI or anyType", () => {
      assert.deepStrictEqual(refusedValues(ncName, ["RESPONSE", " RESPONSE ", "1A", "a:b"]), [
        "1A",
        "a:b",
      ]);
      for (const name of ["string", "normalizedString", "anyURI", "anyType"] as const) {
        assert.deepStrictEqual(refusedValues(builtin(name), ["", " x ", "a\tb"]), []);
      }
    });

    it("applies the base's whitespace before an enumeration's membership", () => {
      assert.deepStrictEqual(refusedValues(oneOf("single"), [" single\n", "single", "Single"]), [
        "Single",
      ]);
      assert.deepStrictEqual(
        refusedValues({ base: "string", kind: "enumeration", values: ["a b"] }, [
          "a b",
          " a b",
          "a\tb",
        ]),
        [" a b", "a\tb"],
      );
      assert.deepStrictEqual(
        refusedValues({ base: "normalizedString", kind: "enumeration", values: ["a b"] }, [
          "a\tb",
          " a b",
        ]),
        [" a b"],
      );
    });

    it("checks each item of a list, which may be empty", () => {
      assert.deepStrictEqual(
        refusedValues({ item: ncName, kind: "list" }, ["A B", " A \n B ", "", "A 1"]),
        ["A 1"],
      );
    });

    it("admits a value any member of a union admits", () => {
      const union: AttributeType = {
        kind: "union",
        members: [builtin("nonNegativeInteger"), oneOf("unbounded")],
      };

      assert.deepStrictEqual(refusedValues(union, ["3", " unbounded ", "x", "-1"]), ["x", "-1"]);
    });

    it("checks a pattern through its JavaScript equivalent, and admits nothing for a pattern with none", () => {
      assert.deepStrictEqual(
        refusedValues({ base: "string", kind: "pattern", pattern: "[0-9]+%?" }, [
          "10",
          "10%",
          "10px",
        ]),
        ["10px"],
      );
      assert.deepStrictEqual(
        refusedValues({ base: "normalizedString", kind: "pattern", pattern: "[a-z]+" }, ["abc"]),
        ["abc"],
      );
    });

    it("compares minInclusive exactly for an integer and as a number for a double", () => {
      assert.deepStrictEqual(
        refusedValues(builtin("integer", "1"), ["1", "+2", "99999999999999999999", "0", "-1"]),
        ["0", "-1"],
      );
      assert.deepStrictEqual(
        refusedValues(builtin("decimal", "0.25"), ["0.25", "0.250", "0.2500001", "0.2499999"]),
        ["0.2499999"],
      );
      assert.deepStrictEqual(
        refusedValues(builtin("double", "0.0"), ["0", "-0", "0.5", "INF", "-1", "-INF", "NaN"]),
        ["-1", "-INF", "NaN"],
      );
    });
  });

  describe('readings 16 and 17, and reading 18 ("an order or graphic-order interaction\'s `min-choices`, where written, is from 1 to its number of choices"): the narrowed attributes', () => {
    it("[I-2] refuses normal-maximum 0, 0.0, -0 and 0e0 as attribute-type, and admits 1 (reading 16)", () => {
      const path = "qti-assessment-item/qti-outcome-declaration/@normal-maximum";

      for (const zero of ["0", "0.0", "-0", "0e0"]) {
        const source = item([outcome(attr("normal-maximum", zero))]);

        assert.deepStrictEqual(found(source), [["attribute-type", at(path)]]);
        assert.strictEqual(first(source)?.detail["reading"], "16");
      }
      assert.deepStrictEqual(found(item([outcome(attr("normal-maximum", "1"))])), []);
    });

    it('[I-2] refuses view="" on an outcome declaration as attribute-type, and admits view="candidate" (reading 17)', () => {
      const source = item([outcome(attr("view", ""))]);

      assert.deepStrictEqual(found(source), [
        ["attribute-type", at("qti-assessment-item/qti-outcome-declaration/@view")],
      ]);
      assert.strictEqual(first(source)?.detail["reading"], "17");
      assert.deepStrictEqual(found(item([outcome(attr("view", "candidate"))])), []);
    });

    it('[I-8] refuses min-choices="0" on an order interaction as attribute-type, and admits it on a choice interaction, by reading 18 ("an order or graphic-order interaction\'s `min-choices`, where written, is from 1 to its number of choices")', () => {
      const order = body(
        el("qti-order-interaction", [
          attr("response-identifier", "RESPONSE"),
          attr("min-choices", "0"),
        ]),
      );
      const choice = body(
        el("qti-choice-interaction", [
          attr("response-identifier", "RESPONSE"),
          attr("min-choices", "0"),
        ]),
      );

      assert.deepStrictEqual(found(order), [
        [
          "attribute-type",
          at("qti-assessment-item/qti-item-body/qti-order-interaction/@min-choices"),
        ],
      ]);
      assert.strictEqual(first(order)?.detail["reading"], "18");
      assert.deepStrictEqual(found(choice), []);
    });
  });

  describe("reading 8: a match table entry's target-value", () => {
    it("[I-2] does not check target-value against the base-type names the XSD enumerates", () => {
      const enumerated: Tables = {
        elements: {
          ...tables.elements,
          "qti-match-table-entry": element({
            attributes: [
              required("source-value", builtin("int")),
              required("target-value", {
                base: "string",
                kind: "enumeration",
                values: ["boolean", "float", "identifier", "integer", "string"],
              }),
            ],
          }),
        },
        types: {},
      };

      assert.deepStrictEqual(found(item([matched("float", "0.5")]), enumerated), []);
    });
  });

  describe("reading 13: data-* names", () => {
    it("[I-8] refuses data-Foo on a p with an ##any wildcard as unknown-attribute, suggesting data-foo", () => {
      const source = body(el("p", [attr("data-Foo", "1")]));

      assert.deepStrictEqual(found(source), [
        ["unknown-attribute", at("qti-assessment-item/qti-item-body/p/@data-Foo")],
      ]);
      assert.deepStrictEqual(first(source)?.suggestion, Option.some("data-foo"));
      assert.deepStrictEqual(first(source)?.detail, {
        attribute: "data-Foo",
        element: "p",
        reading: "13",
      });
      assert.deepStrictEqual(found(body(el("p", [attr("data-foo", "1")]))), []);
    });

    it("[I-8] suggests nothing for a data-* name that lower case does not repair", () => {
      for (const name of ["data-", "data-É"]) {
        const source = body(el("p", [attr(name, "1")]));

        assert.strictEqual(first(source)?.rule, "unknown-attribute");
        assert.deepStrictEqual(first(source)?.suggestion, Option.none());
      }
    });
  });

  describe('readings 22 and 23, and reading 38 ("a `qti-gap` appears only within a gap-match interaction, and a `qti-hottext` may appear in any flow or inline content"): placements', () => {
    it("[I-2] refuses a qti-template-constraint inside qti-template-if as misplaced-element, and still walks it (reading 22)", () => {
      const constraint =
        "qti-assessment-item/qti-template-processing/qti-template-condition/qti-template-if/qti-template-constraint";
      const source = item([
        el(
          "qti-template-processing",
          [],
          [
            el(
              "qti-template-condition",
              [],
              [
                el(
                  "qti-template-if",
                  [],
                  [el("qti-template-constraint", [], [el("qti-base-value")])],
                ),
              ],
            ),
          ],
        ),
      ]);

      assert.deepStrictEqual(found(source), [
        ["misplaced-element", at(constraint)],
        ["missing-attribute", at(`${constraint}/qti-base-value`)],
      ]);
      assert.strictEqual(first(source)?.detail["reading"], "22");
      assert.deepStrictEqual(
        found(item([el("qti-template-processing", [], [el("qti-template-constraint")])])),
        [],
      );
    });

    it("refuses a qti-number-correct in an item's response processing as misplaced-element (reading 23)", () => {
      const source = processed(el("qti-number-correct"));

      assert.deepStrictEqual(found(source), [
        ["misplaced-element", at(`${setOutcome}/qti-number-correct`)],
      ]);
      assert.strictEqual(first(source)?.detail["reading"], "23");
    });

    it("admits a qti-number-correct inside qti-outcome-processing (reading 23)", () => {
      const source = doc(
        location,
        el(
          "qti-outcome-processing",
          [],
          [el("qti-set-outcome-value", [attr("identifier", "SCORE")], [el("qti-number-correct")])],
        ),
      );

      assert.deepStrictEqual(found(source), []);
    });

    it("leaves a test's or a section's misplaced outcome-only expression to the test prose rules (reading 23)", () => {
      const branch = el(
        "qti-branch-rule",
        [attr("target", "EXIT_TEST")],
        [
          el(
            "qti-gte",
            [],
            [
              el("qti-number-correct"),
              el("qti-base-value", [attr("base-type", "integer")], [text("1")]),
            ],
          ),
        ],
      );
      const section = el(
        "qti-assessment-section",
        [attr("identifier", "S"), attr("title", "S"), attr("visible", "true")],
        [
          el(
            "qti-assessment-item-ref",
            [attr("href", "items/q1.xml"), attr("identifier", "q1")],
            [branch],
          ),
        ],
      );
      const test = doc(
        location,
        el(
          "qti-assessment-test",
          [attr("identifier", "T"), attr("title", "Test")],
          [
            el(
              "qti-test-part",
              [
                attr("identifier", "P"),
                attr("navigation-mode", "linear"),
                attr("submission-mode", "individual"),
              ],
              [section],
            ),
          ],
        ),
      );

      assert.deepStrictEqual(found(test, generatedTables), []);
      assert.deepStrictEqual(found(doc(location, section), generatedTables), []);
    });

    it('[I-8] refuses a qti-gap outside a qti-gap-match-interaction as misplaced-element, by reading 38 ("a `qti-gap` appears only within a gap-match interaction, and a `qti-hottext` may appear in any flow or inline content")', () => {
      const gap = el("qti-gap", [attr("identifier", "G1")]);
      const loose = body(el("p", [], [gap]));
      const graphic = body(
        el(
          "qti-graphic-gap-match-interaction",
          [attr("response-identifier", "RESPONSE")],
          [el("qti-gap-text", [attr("identifier", "T1"), attr("match-max", "1")], [gap])],
        ),
      );
      const matching = body(
        el(
          "qti-gap-match-interaction",
          [attr("response-identifier", "RESPONSE")],
          [el("p", [], [gap])],
        ),
      );

      assert.deepStrictEqual(found(loose), [
        ["misplaced-element", at("qti-assessment-item/qti-item-body/p/qti-gap")],
      ]);
      assert.strictEqual(first(loose)?.detail["reading"], "38");
      assert.deepStrictEqual(found(graphic), [
        [
          "misplaced-element",
          at(
            "qti-assessment-item/qti-item-body/qti-graphic-gap-match-interaction/qti-gap-text/qti-gap",
          ),
        ],
      ]);
      assert.deepStrictEqual(found(matching), []);
    });
  });

  describe("the information model's mapping placements (pantry mapping-base-type)", () => {
    it("[I-1] refuses a qti-mapping in a file response, the mapping its base type forbids, as misplaced-element (pantry mapping-base-type; info.txt:34086)", () => {
      assert.deepStrictEqual(
        judgedMapping(mappingItem("single", Option.some("file"), mapping)),
        misplacedMapping("qti-mapping", mappable),
      );
    });

    it("[I-1] refuses a qti-mapping in a duration response, the mapping its base type forbids, as misplaced-element (pantry mapping-base-type; info.txt:34086)", () => {
      assert.deepStrictEqual(
        judgedMapping(mappingItem("single", Option.some("duration"), mapping)),
        misplacedMapping("qti-mapping", mappable),
      );
    });

    it("[I-1] refuses a qti-mapping in a record response, the mapping its base type forbids, as misplaced-element (pantry mapping-base-type; info.txt:9306)", () => {
      assert.deepStrictEqual(
        judgedMapping(mappingItem("record", Option.none(), mapping)),
        misplacedMapping("qti-mapping", mappable),
      );
    });

    it("[I-1] refuses a qti-area-mapping in an identifier response, an area mapping off a point, as misplaced-element (pantry mapping-base-type; info.txt:39388)", () => {
      assert.deepStrictEqual(
        judgedMapping(mappingItem("single", Option.some("identifier"), areaMapping)),
        misplacedMapping("qti-area-mapping", pointed),
      );
    });

    it("[I-1] refuses a qti-area-mapping in a record response, an area mapping off a point, as misplaced-element (pantry mapping-base-type; info.txt:39388)", () => {
      assert.deepStrictEqual(
        judgedMapping(mappingItem("record", Option.none(), areaMapping)),
        misplacedMapping("qti-area-mapping", pointed),
      );
    });

    it("[I-1] admits a qti-mapping in a string and a directedPair response, and a qti-area-mapping in a single and a multiple point response (pantry mapping-base-type)", () => {
      assert.deepStrictEqual(
        [
          mappingItem("single", Option.some("string"), mapping),
          mappingItem("multiple", Option.some("directedPair"), mapping),
          mappingItem("single", Option.some("point"), areaMapping),
          mappingItem("multiple", Option.some("point"), areaMapping),
        ].map(judgedMapping),
        [[], [], [], []],
      );
    });
  });

  describe("reading 10: both ARIA spellings", () => {
    it("[A-1] admits aria-keyshorts and aria-keyshortcuts on an img", () => {
      const source = body(
        el("img", [attr("aria-keyshorts", "Alt+K"), attr("aria-keyshortcuts", "Alt+K")]),
      );

      assert.deepStrictEqual(found(source), []);
    });
  });

  describe('reading 90 ("on an element the Schematron\'s extension-attribute lists cover, an attribute its XSD does not declare is a `data-` attribute, or the document is refused")', () => {
    it("align-54 extension lists E10: refuses object's alt and qti-extended-text-interaction's patternMask, which neither declares, as unknown-attribute", () => {
      const extended = wholeItem([
        el(
          "qti-item-body",
          [],
          [
            el("qti-extended-text-interaction", [
              attr("response-identifier", "RESPONSE"),
              attr("patternMask", "x"),
            ]),
          ],
        ),
      ]);

      assert.isTrue(generatedTables.elements["object"]?.extensionCovered);
      assert.isTrue(generatedTables.elements["qti-extended-text-interaction"]?.extensionCovered);
      assert.deepStrictEqual(judged(objectWith(attr("alt", "x"))), [
        [
          "unknown-attribute",
          objectAttribute("alt"),
          { attribute: "alt", element: "object", reading: "90" },
        ],
      ]);
      assert.deepStrictEqual(judged(extended), [
        [
          "unknown-attribute",
          at("qti-assessment-item/qti-item-body/qti-extended-text-interaction/@patternMask"),
          {
            attribute: "patternMask",
            element: "qti-extended-text-interaction",
            reading: "90",
          },
        ],
      ]);
    });

    it("align-54 extension lists E10: refuses an attribute in another namespace, and an xml: attribute the element does not declare, xml:id and xml:space, as unknown-attribute", () => {
      for (const [written, name] of [
        [attr("x", "1", otherNamespace), `{${otherNamespace}}x`],
        [attr("id", "o1", xmlNamespace), "xml:id"],
        [attr("space", "preserve", xmlNamespace), "xml:space"],
      ] as const) {
        assert.deepStrictEqual(
          judged(objectWith(written)),
          [
            [
              "unknown-attribute",
              objectAttribute(name),
              { attribute: name, element: "object", reading: "90" },
            ],
          ],
          name,
        );
      }
    });

    it("align-54 extension lists E10: accepts a data- attribute, a valid xsi:type and reading 10's aria-keyshortcuts on a covered element", () => {
      const objectTyped = objectWith(
        attr("qti", qtiNamespace, xmlnsNamespace),
        attr("type", "qti:ObjectDType", xsiNamespace),
      );
      const shortcut = wholeItem([
        el(
          "qti-item-body",
          [],
          [
            el(
              "p",
              [],
              [
                el("img", [
                  attr("alt", "A map"),
                  attr("src", "map.png"),
                  attr("aria-keyshortcuts", "Alt+K"),
                ]),
              ],
            ),
          ],
        ),
      ]);

      assert.isTrue(generatedTables.elements["img"]?.extensionCovered);
      assert.deepStrictEqual(judged(objectWith(attr("data-x", "1"))), []);
      assert.deepStrictEqual(judged(objectTyped), []);
      assert.deepStrictEqual(judged(shortcut), []);
    });

    it("align-54 extension lists E10: refuses a data- name reading 13 refuses as reading 13 does, suggesting its lower case", () => {
      const source = objectWith(attr("data-X", "1"));

      assert.deepStrictEqual(judged(source), [
        [
          "unknown-attribute",
          objectAttribute("data-X"),
          { attribute: "data-X", element: "object", reading: "13" },
        ],
      ]);
      assert.deepStrictEqual(
        checkStructure(source, generatedTables)[0]?.suggestion,
        Option.some("data-x"),
      );
    });

    it("align-54 extension lists E10: leaves an element the lists do not cover to its wildcard, so qti-custom-operator keeps an attribute in another namespace", () => {
      const operator = wholeItem([
        el(
          "qti-response-processing",
          [],
          [
            el(
              "qti-set-outcome-value",
              [attr("identifier", "SCORE")],
              [el("qti-custom-operator", [attr("x", "1", otherNamespace)])],
            ),
          ],
        ),
      ]);
      const written = `qti-assessment-item/qti-response-processing/qti-set-outcome-value/qti-custom-operator/@{${otherNamespace}}x`;

      assert.isUndefined(generatedTables.elements["qti-custom-operator"]?.extensionCovered);
      assert.deepStrictEqual(
        judged(operator).filter(
          ([, refused]) => refused.kind === "path" && refused.path === written,
        ),
        [],
      );
    });
  });

  describe("readings 20 and 21, and single cardinality: child counts", () => {
    it("[Q-31] refuses a PCI with no qti-interaction-markup, or two, as child-count (reading 20)", () => {
      const path = "qti-assessment-item/qti-item-body/qti-portable-custom-interaction";
      const none = customInteraction();

      assert.deepStrictEqual(found(none), [["child-count", at(path)]]);
      assert.deepStrictEqual(first(none)?.detail, {
        child: "qti-interaction-markup",
        element: "qti-portable-custom-interaction",
        required: "exactly one",
        source: "reading 20",
      });
      assert.deepStrictEqual(
        found(customInteraction(el("qti-interaction-markup"), el("qti-interaction-markup"))),
        [["child-count", at(path)]],
      );
      assert.deepStrictEqual(
        found(customInteraction(text("\n  "), el("qti-interaction-markup"))),
        [],
      );
    });

    it("refuses an empty qti-repeat as child-count, counting no text, and admits one with an operand (reading 21)", () => {
      const empty = processed(el("qti-repeat", [], [text("\n  ")]));

      assert.deepStrictEqual(found(empty), [["child-count", at(`${setOutcome}/qti-repeat`)]]);
      assert.deepStrictEqual(first(empty)?.detail, {
        child: "operand",
        element: "qti-repeat",
        required: "at least one",
        source: "reading 21",
      });
      assert.deepStrictEqual(
        found(
          processed(
            el(
              "qti-repeat",
              [],
              [el("qti-base-value", [attr("base-type", "integer")], [text("1")])],
            ),
          ),
        ),
        [],
      );
    });

    it("[I-1] refuses two values in a single response's qti-correct-response as child-count", () => {
      const two = corrected("single", value("A"), value("B"));

      assert.deepStrictEqual(found(two), [
        ["child-count", at("qti-assessment-item/qti-response-declaration/qti-correct-response")],
      ]);
      assert.deepStrictEqual(first(two)?.detail, {
        child: "qti-value",
        element: "qti-correct-response",
        required: "exactly one",
        source: "info.txt:73049",
      });
      assert.deepStrictEqual(found(corrected("single", value("A"))), []);
      assert.deepStrictEqual(found(corrected("multiple", value("A"), value("B"))), []);
    });

    it("[I-2] refuses two values in a single outcome's qti-default-value as child-count", () => {
      assert.deepStrictEqual(found(defaulted(value("0"), value("1"))), [
        ["child-count", at("qti-assessment-item/qti-outcome-declaration/qti-default-value")],
      ]);
      assert.deepStrictEqual(found(defaulted(value("0"))), []);
    });
  });

  describe("reading 46: the count attributes", () => {
    it("[Q-2] refuses max-choices above 2^63 - 1 as count-range, and admits 2^63 - 1", () => {
      const over = choosing("9223372036854775808");

      assert.deepStrictEqual(found(over), [
        [
          "count-range",
          at("qti-assessment-item/qti-item-body/qti-choice-interaction/@max-choices"),
        ],
      ]);
      assert.deepStrictEqual(
        first(over)?.detail,
        rangeDetail("max-choices", "9223372036854775808"),
      );
      assert.deepStrictEqual(found(choosing("9223372036854775807")), []);
    });

    it("[I-8] refuses max-plays above 2^63 - 1 as count-range", () => {
      const source = body(
        el("qti-media-interaction", [
          attr("response-identifier", "RESPONSE"),
          attr("max-plays", "9223372036854775808"),
        ]),
      );

      assert.deepStrictEqual(found(source), [
        ["count-range", at("qti-assessment-item/qti-item-body/qti-media-interaction/@max-plays")],
      ]);
      assert.deepStrictEqual(
        first(source)?.detail,
        rangeDetail("max-plays", "9223372036854775808"),
      );
    });

    it("refuses figures below -2^63 as count-range, and admits both bounds and the variable form", () => {
      const under = rounded("-9223372036854775809");

      assert.deepStrictEqual(found(under), [
        ["count-range", at(`${setOutcome}/qti-round-to/@figures`)],
      ]);
      assert.deepStrictEqual(first(under)?.detail, rangeDetail("figures", "-9223372036854775809"));
      for (const figures of ["9223372036854775807", "-9223372036854775808", "digits"]) {
        assert.deepStrictEqual(found(rounded(figures)), []);
      }
    });

    it("[Q-20] [Q-5] never refuses expected-length or max-strings for size", () => {
      const source = body(
        el(
          "p",
          [],
          [
            el("qti-text-entry-interaction", [
              attr("response-identifier", "RESPONSE"),
              attr("expected-length", "9223372036854775808"),
            ]),
          ],
        ),
        el("qti-extended-text-interaction", [
          attr("response-identifier", "ESSAY"),
          attr("max-strings", "9223372036854775808"),
        ]),
      );

      assert.deepStrictEqual(found(source), []);
    });

    it("refuses every declaration of a reading-46 count in the generated tables above 2^63 - 1", () => {
      const counts = new Set([
        "max-choices",
        "min-choices",
        "max-associations",
        "min-associations",
        "match-max",
        "match-min",
        "max-plays",
        "min-plays",
        "figures",
      ]);
      const declared = Object.entries(generatedTables.elements).flatMap(([name, table]) =>
        table.attributes
          .filter((declaration) => declaration.namespace === "" && counts.has(declaration.local))
          .map((declaration) => [name, declaration.local] as const),
      );

      // The 37 lines `grep -nE 'name="(max-choices|…|figures)"'` prints over the XSD of 0.1.
      assert.strictEqual(declared.length, 37);
      for (const [name, local] of declared) {
        const ranged = found(
          doc(location, el(name, [attr(local, "9223372036854775808")])),
          generatedTables,
        ).filter(([rule]) => rule === "count-range");

        assert.deepStrictEqual(ranged, [["count-range", at(`${name}/@${local}`)]]);
      }
    });
  });

  describe("the information model's bounds on a literal figures and n (pantry P10, P11), and number-repeats' xs:int (P6)", () => {
    it("[I-9a] refuses qti-round-to's figures 0 under significantFigures as attribute-type (P10, info.txt:39732), and admits 1", () => {
      const zero = literal(
        "qti-round-to",
        attr("rounding-mode", "significantFigures"),
        attr("figures", "0"),
      );

      assert.deepStrictEqual(found(zero, generatedTables), [
        ["attribute-type", at("qti-round-to/@figures")],
      ]);
      assert.deepStrictEqual(
        first(zero, generatedTables)?.detail,
        figuresDetail("qti-round-to", "0", "significantFigures", "info.txt:39732"),
      );
      assert.deepStrictEqual(
        found(
          literal(
            "qti-round-to",
            attr("rounding-mode", "significantFigures"),
            attr("figures", "1"),
          ),
          generatedTables,
        ),
        [],
      );
    });

    it("[I-9a] refuses qti-round-to's figures -1 under decimalPlaces as attribute-type (P10, info.txt:39732), and admits 0", () => {
      const negative = literal(
        "qti-round-to",
        attr("rounding-mode", "decimalPlaces"),
        attr("figures", " -1 "),
      );

      assert.deepStrictEqual(found(negative, generatedTables), [
        ["attribute-type", at("qti-round-to/@figures")],
      ]);
      assert.deepStrictEqual(
        first(negative, generatedTables)?.detail,
        figuresDetail("qti-round-to", " -1 ", "decimalPlaces", "info.txt:39732"),
      );
      assert.deepStrictEqual(
        found(
          literal("qti-round-to", attr("rounding-mode", "decimalPlaces"), attr("figures", "0")),
          generatedTables,
        ),
        [],
      );
    });

    it("[I-9a] refuses qti-equal-rounded's figures 0 with no rounding-mode, the significantFigures default, as attribute-type (P10, info.txt:25131)", () => {
      const unwritten = literal("qti-equal-rounded", attr("figures", "0"));

      assert.deepStrictEqual(found(unwritten, generatedTables), [
        ["attribute-type", at("qti-equal-rounded/@figures")],
      ]);
      assert.deepStrictEqual(
        first(unwritten, generatedTables)?.detail,
        figuresDetail("qti-equal-rounded", "0", "significantFigures", "info.txt:25131"),
      );
      assert.deepStrictEqual(
        found(
          literal(
            "qti-equal-rounded",
            attr("rounding-mode", "decimalPlaces"),
            attr("figures", "0"),
          ),
          generatedTables,
        ),
        [],
      );
    });

    it("[I-9a] admits a figures that names a variable under either mode, its value known only at run time", () => {
      for (const mode of ["decimalPlaces", "significantFigures"]) {
        for (const name of ["qti-equal-rounded", "qti-round-to"]) {
          assert.deepStrictEqual(
            found(
              literal(name, attr("rounding-mode", mode), attr("figures", "DIGITS")),
              generatedTables,
            ),
            [],
          );
        }
      }
    });

    it("[I-9a] refuses qti-index's n 0 and -3 as attribute-type (P11, info.txt:9426), and admits 1 and a variable's name", () => {
      for (const n of ["0", "-3"]) {
        const below = literal("qti-index", attr("n", n));

        assert.deepStrictEqual(found(below, generatedTables), [
          ["attribute-type", at("qti-index/@n")],
        ]);
        assert.deepStrictEqual(first(below, generatedTables)?.detail, {
          attribute: "n",
          element: "qti-index",
          expected: "an integer at least 1",
          least: "1",
          source: "info.txt:9426",
          value: n,
        });
      }
      for (const n of ["1", "POSITION"]) {
        assert.deepStrictEqual(found(literal("qti-index", attr("n", n)), generatedTables), []);
      }
    });

    it("[I-9a] refuses qti-repeat's number-repeats 2147483648 as attribute-type through the XSD's xs:int (P6), and admits 2147483647", () => {
      const over = repeated("2147483648");

      assert.deepStrictEqual(found(over, generatedTables), [
        ["attribute-type", at("qti-repeat/@number-repeats")],
      ]);
      assert.deepStrictEqual(first(over, generatedTables)?.detail, {
        attribute: "number-repeats",
        element: "qti-repeat",
        expected: "NCName or int",
        value: "2147483648",
      });
      assert.deepStrictEqual(found(repeated("2147483647"), generatedTables), []);
    });

    it("[I-9a] refuses a qti-equal whose tolerance-mode is absolute or relative and that has no tolerance as missing-attribute (P36, info.txt:24946)", () => {
      for (const mode of ["absolute", "relative"]) {
        const untolerant = literal("qti-equal", attr("tolerance-mode", mode));

        assert.deepStrictEqual(found(untolerant, generatedTables), [
          ["missing-attribute", at("qti-equal")],
        ]);
        assert.deepStrictEqual(first(untolerant, generatedTables)?.detail, {
          attribute: "tolerance",
          element: "qti-equal",
          source: "info.txt:24946",
          whenAttribute: "tolerance-mode",
          whenValue: mode,
        });
      }
    });

    it("[I-9a] admits a qti-equal with one tolerance token under absolute and relative, and with none under exact, written or the default", () => {
      for (const tolerant of [
        literal("qti-equal", attr("tolerance-mode", "absolute"), attr("tolerance", "0.5")),
        literal("qti-equal", attr("tolerance-mode", "relative"), attr("tolerance", "5")),
        literal("qti-equal", attr("tolerance-mode", "exact")),
        literal("qti-equal"),
      ]) {
        assert.deepStrictEqual(found(tolerant, generatedTables), []);
      }
    });
  });

  describe("the built-in variables' reserved identifiers (pantry DeclarationNotReserved) and qti-equal's tolerance values (reading 121)", () => {
    it("[I-9a] refuses a declaration named completionStatus, numAttempts or duration as attribute-type, on each of the four declarations (pantry DeclarationNotReserved; info.txt:12006, :22603, :39226, :45843)", () => {
      for (const [name, line] of reservations) {
        for (const identifier of ["completionStatus", "numAttempts", "duration", " duration "]) {
          const source = declaredAs(name, identifier);

          assert.deepStrictEqual(found(source, generatedTables), [
            ["attribute-type", at(`${name}/@identifier`)],
          ]);
          assert.deepStrictEqual(first(source, generatedTables)?.detail, {
            attribute: "identifier",
            check: "reserved-identifier",
            element: name,
            expected:
              "an identifier other than the built-in variables' completionStatus, numAttempts and duration",
            pantry: "DeclarationNotReserved",
            source: line,
            value: identifier,
          });
        }
      }
    });

    it("[I-9a] admits a declaration with any other identifier, a built-in's name in another case and QTI_CONTEXT among them", () => {
      for (const [name] of reservations) {
        for (const identifier of [
          "TOTAL",
          "Duration",
          "completionstatus",
          "numAttempts2",
          "QTI_CONTEXT",
        ]) {
          assert.deepStrictEqual(
            found(declaredAs(name, identifier), generatedTables),
            [],
            identifier,
          );
        }
      }
    });

    it("[I-9a] refuses a reserved identifier on a declaration inside an item and inside a test (pantry DeclarationNotReserved)", () => {
      const status = el("qti-outcome-declaration", [
        attr("identifier", "completionStatus"),
        attr("cardinality", "single"),
        attr("base-type", "identifier"),
      ]);
      const timed = el("qti-outcome-declaration", [
        attr("identifier", "duration"),
        attr("cardinality", "single"),
        attr("base-type", "float"),
      ]);

      assert.deepStrictEqual(mistyped(item([status])), [
        at("qti-assessment-item/qti-outcome-declaration/@identifier"),
      ]);
      assert.deepStrictEqual(
        mistyped(
          doc(
            location,
            el("qti-assessment-test", [attr("identifier", "test"), attr("title", "Test")], [timed]),
          ),
        ),
        [at("qti-assessment-test/qti-outcome-declaration/@identifier")],
      );
    });

    it("align-54 R3 test declarations F2: admits a test's outcome declarations numAttempts and completionStatus, and its context declaration numAttempts, which shadow no built-in of a test (reading 168)", () => {
      const context = el("qti-context-declaration", [
        attr("identifier", "numAttempts"),
        attr("cardinality", "single"),
        attr("base-type", "integer"),
      ]);

      assert.deepStrictEqual(
        found(
          testDeclaring([
            outcomeOf("numAttempts", "integer"),
            outcomeOf("completionStatus", "identifier"),
            outcomeOf(" numAttempts ", "integer"),
          ]),
          generatedTables,
        ),
        [],
      );
      assert.deepStrictEqual(found(testDeclaring([context]), generatedTables), []);
    });

    it("align-54 R3 test declarations F2: refuses a test's outcome or context declaration named duration as attribute-type, its expected naming duration alone (reading 168)", () => {
      for (const [name, line] of reservations.filter(
        ([kind]) => kind === "qti-context-declaration" || kind === "qti-outcome-declaration",
      )) {
        for (const identifier of ["duration", " duration "]) {
          const source = testDeclaring([
            el(name, [
              attr("identifier", identifier),
              attr("cardinality", "single"),
              attr("base-type", "float"),
            ]),
          ]);

          assert.deepStrictEqual(found(source, generatedTables), [
            ["attribute-type", at(`qti-assessment-test/${name}/@identifier`)],
          ]);
          assert.deepStrictEqual(first(source, generatedTables)?.detail, {
            attribute: "identifier",
            check: "reserved-identifier",
            element: name,
            expected: "an identifier other than the built-in variable duration",
            pantry: "DeclarationNotReserved",
            source: line,
            value: identifier,
          });
        }
      }
    });

    it("align-54 R3 test declarations F2: still refuses an item's declaration of each kind named completionStatus, numAttempts or duration, its expected naming all three (reading 168)", () => {
      for (const [name, line] of reservations) {
        for (const identifier of ["completionStatus", "numAttempts", "duration"]) {
          assert.deepStrictEqual(
            declarationRefusals(
              item([
                el(name, [
                  attr("identifier", identifier),
                  attr("cardinality", "single"),
                  attr("base-type", "identifier"),
                ]),
              ]),
            ),
            [
              [
                "attribute-type",
                at(`qti-assessment-item/${name}/@identifier`),
                {
                  attribute: "identifier",
                  check: "reserved-identifier",
                  element: name,
                  expected:
                    "an identifier other than the built-in variables' completionStatus, numAttempts and duration",
                  pantry: "DeclarationNotReserved",
                  source: line,
                  value: identifier,
                },
              ],
            ],
            `${name} ${identifier}`,
          );
        }
      }
    });

    it("[I-9a] refuses an outcome named SCORE or MAXSCORE that is not a float, and one named PASSED that is not a boolean, as attribute-type at its base-type (pantry ReservedOutcomeTypes; info.txt:8478, :8480, :8482)", () => {
      for (const [identifier, fixed, line] of typedOutcomes) {
        for (const written of [identifier, ` ${identifier} `]) {
          for (const wrong of ["integer", "string", "identifier", "float", "boolean"]) {
            if (wrong === fixed) {
              continue;
            }

            const source = outcomeAs(written, wrong);
            const label = `${written} ${wrong}`;

            assert.deepStrictEqual(
              found(source, generatedTables),
              [["attribute-type", at("qti-outcome-declaration/@base-type")]],
              label,
            );
            assert.deepStrictEqual(
              first(source, generatedTables)?.detail,
              {
                attribute: "base-type",
                baseType: fixed,
                check: "reserved-outcome-type",
                element: "qti-outcome-declaration",
                expected: `${fixed}, the base type of an outcome named ${identifier}`,
                identifier,
                pantry: "ReservedOutcomeTypes",
                source: line,
                value: wrong,
              },
              label,
            );
          }
        }
      }
    });

    it("[I-9a] admits SCORE and MAXSCORE as floats and PASSED as a boolean, single, multiple or ordered, and every other outcome of any base type", () => {
      for (const [identifier, fixed] of typedOutcomes) {
        for (const cardinality of ["single", "multiple", "ordered"]) {
          assert.deepStrictEqual(
            found(outcomeAs(identifier, fixed, cardinality), generatedTables),
            [],
            `${identifier} ${cardinality}`,
          );
        }
      }
      for (const [identifier, fixed] of [
        ["TOTAL", "integer"],
        ["Score", "integer"],
        ["MAXSCORE2", "string"],
        ["passed", "integer"],
      ] as const) {
        assert.deepStrictEqual(
          found(outcomeAs(identifier, fixed), generatedTables),
          [],
          identifier,
        );
      }
    });

    it("[I-9a] admits SCORE, MAXSCORE and PASSED of any base type on a response or template declaration, which is no outcome", () => {
      for (const [identifier] of typedOutcomes) {
        for (const name of ["qti-response-declaration", "qti-template-declaration"]) {
          assert.deepStrictEqual(
            found(
              literal(
                name,
                attr("identifier", identifier),
                attr("cardinality", "single"),
                attr("base-type", "integer"),
              ),
              generatedTables,
            ),
            [],
            `${name} ${identifier}`,
          );
        }
      }
    });

    it("[I-9a] refuses a mistyped SCORE inside an item and a mistyped PASSED inside a test (pantry ReservedOutcomeTypes)", () => {
      const score = el("qti-outcome-declaration", [
        attr("identifier", "SCORE"),
        attr("cardinality", "single"),
        attr("base-type", "integer"),
      ]);
      const passed = el("qti-outcome-declaration", [
        attr("identifier", "PASSED"),
        attr("cardinality", "single"),
        attr("base-type", "integer"),
      ]);

      assert.deepStrictEqual(mistyped(item([score])), [
        at("qti-assessment-item/qti-outcome-declaration/@base-type"),
      ]);
      assert.deepStrictEqual(
        mistyped(
          doc(
            location,
            el(
              "qti-assessment-test",
              [attr("identifier", "test"), attr("title", "Test")],
              [passed],
            ),
          ),
        ),
        [at("qti-assessment-test/qti-outcome-declaration/@base-type")],
      );
    });

    it("[I-9a] admits a test's SCORE and MAXSCORE of every base type, which the information model types in an item only (info.txt:8478, :8480), while an item's SCORE and a test's PASSED stay typed", () => {
      for (const base of [
        "boolean",
        "directedPair",
        "duration",
        "file",
        "identifier",
        "integer",
        "pair",
        "point",
        "string",
        "uri",
      ]) {
        assert.deepStrictEqual(
          mistyped(testDeclaring([outcomeOf("SCORE", base), outcomeOf("MAXSCORE", base)])),
          [],
          base,
        );
      }
      assert.deepStrictEqual(mistyped(item([outcomeOf("SCORE", "integer")])), [
        at("qti-assessment-item/qti-outcome-declaration/@base-type"),
      ]);
      assert.deepStrictEqual(mistyped(testDeclaring([outcomeOf("PASSED", "integer")])), [
        at("qti-assessment-test/qti-outcome-declaration/@base-type"),
      ]);
    });

    it("align-54 value grammars E24: refuses a qti-equal tolerance of no value, of three values, or with a number not above 0, 0, -1 and NaN among them, as attribute-type (reading 121)", () => {
      for (const tolerance of [
        "",
        " ",
        "1 2 3",
        "TOL 1 2",
        "0",
        "-1",
        "NaN",
        "-INF",
        "-0",
        "+0",
        "0.0",
        "0e5",
        ".0E-3",
        "-0.1234567890123456",
        "0.5 0",
        "TOL -1",
        "NaN 1",
      ]) {
        const source = tolerated(tolerance);

        assert.deepStrictEqual(
          found(source, generatedTables),
          [["attribute-type", at("qti-equal/@tolerance")]],
          JSON.stringify(tolerance),
        );
        assert.deepStrictEqual(first(source, generatedTables)?.detail, {
          attribute: "tolerance",
          check: "tolerance-token",
          element: "qti-equal",
          expected:
            "one or two values, one space apart, each a number above 0 or a variable's name",
          reading: "121",
          value: tolerance,
        });
      }
    });

    it("align-54 value grammars E24: accepts one or two values, each a number above 0 or a variable's name, +INF and 1,5 among them, which name variables read at run time (reading 121)", () => {
      for (const tolerance of [
        "+INF",
        "1,5",
        "0.5 1,5",
        "{TOL}",
        "1.5.5",
        "5%",
        "-TOL",
        "TOL 1e",
        "0.5",
        "1 2",
        "TOL",
        "INF",
        "INF INF",
        "1e-3",
        "1e-400",
        "0.5e0",
        ".5",
        "5.",
        "+2",
        "00.010",
        "TOL 0.5",
        "_low é",
        " 0.5\t1\n",
      ]) {
        assert.deepStrictEqual(
          found(tolerated(tolerance), generatedTables),
          [],
          JSON.stringify(tolerance),
        );
      }
    });

    it("align-54 value grammars E24: refuses a tolerance of 0 under exact, the default mode, as under absolute, since the count and the sign bind every tolerance (reading 121)", () => {
      for (const exact of [
        literal("qti-equal", attr("tolerance", "0")),
        literal("qti-equal", attr("tolerance-mode", "exact"), attr("tolerance", "")),
      ]) {
        assert.deepStrictEqual(found(exact, generatedTables), [
          ["attribute-type", at("qti-equal/@tolerance")],
        ]);
      }
    });
  });

  describe("align-54 reserved outcomes: records as reserved outcomes and record declarations (readings 153 and 158)", () => {
    it("align-54 reserved outcomes B1b: refuses an item's SCORE and MAXSCORE, and a lone declaration's, declared record, as attribute-type at its cardinality, whether or not it writes a base-type (reading 153)", () => {
      for (const [identifier, fixed] of typedOutcomes) {
        if (identifier === "PASSED") {
          continue;
        }

        const record = recordOutcome(identifier);
        const cardinality = "qti-assessment-item/qti-outcome-declaration/@cardinality";

        assert.deepStrictEqual(
          declarationRefusals(item([record])),
          [["attribute-type", at(cardinality), reservedRecord(identifier, fixed)]],
          identifier,
        );
        assert.deepStrictEqual(
          declarationRefusals(item([recordOutcome(identifier, fixed)])).map(([rule, where]) => [
            rule,
            where,
          ]),
          [
            ["attribute-type", at(cardinality)],
            ["unknown-attribute", at("qti-assessment-item/qti-outcome-declaration/@base-type")],
          ],
          `${identifier} with a base-type`,
        );
        assert.deepStrictEqual(
          found(doc(location, recordOutcome(` ${identifier} `)), generatedTables),
          [["attribute-type", at("qti-outcome-declaration/@cardinality")]],
          `a lone ${identifier}`,
        );
      }
    });

    it("align-54 reserved outcomes B1b: refuses a PASSED declared record in an item and in a test, as attribute-type at its cardinality (reading 153)", () => {
      assert.deepStrictEqual(declarationRefusals(item([recordOutcome("PASSED")])), [
        [
          "attribute-type",
          at("qti-assessment-item/qti-outcome-declaration/@cardinality"),
          reservedRecord("PASSED", "boolean"),
        ],
      ]);
      assert.deepStrictEqual(found(testDeclaring([recordOutcome("PASSED")]), generatedTables), [
        ["attribute-type", at("qti-assessment-test/qti-outcome-declaration/@cardinality")],
      ]);
    });

    it("align-54 reserved outcomes B1b: admits a test's SCORE and MAXSCORE declared record, which a test may declare of any base type (P8), and a record outcome of any other name", () => {
      assert.deepStrictEqual(
        found(
          testDeclaring([
            recordOutcome("SCORE"),
            recordOutcome("MAXSCORE"),
            recordOutcome("TOTAL"),
          ]),
          generatedTables,
        ),
        [],
      );
      assert.deepStrictEqual(
        declarationRefusals(item([recordOutcome("Score"), recordOutcome("TOTAL")])),
        [],
      );
      for (const kind of ["qti-response-declaration", "qti-template-declaration"]) {
        assert.deepStrictEqual(
          declarationRefusals(
            item([el(kind, [attr("identifier", "SCORE"), attr("cardinality", "record")])]),
          ),
          [],
          kind,
        );
      }
    });

    it("align-54 reserved outcomes B1c: refuses a base-type on a record declaration of each kind, as unknown-attribute at the base-type (reading 153)", () => {
      for (const kind of variableKinds) {
        for (const base of ["float", "string", "identifier"]) {
          const source = item([
            el(kind, [
              attr("identifier", "RECORD"),
              attr("cardinality", "record"),
              attr("base-type", base),
            ]),
          ]);

          assert.deepStrictEqual(
            declarationRefusals(source),
            [
              [
                "unknown-attribute",
                at(`qti-assessment-item/${kind}/@base-type`),
                { attribute: "base-type", element: kind, reading: "153" },
              ],
            ],
            `${kind} ${base}`,
          );
        }
      }
    });

    it("align-54 reserved outcomes B1c: leaves a record's base-type that spells no base type, and a base-type beside a cardinality that spells no cardinality, to the value domain alone (reading 158)", () => {
      assert.deepStrictEqual(
        declarationRefusals(
          item([
            el("qti-outcome-declaration", [
              attr("identifier", "RECORD"),
              attr("cardinality", "record"),
              attr("base-type", " float"),
            ]),
          ]),
        ).map(([rule, where]) => [rule, where]),
        [["attribute-type", at("qti-assessment-item/qti-outcome-declaration/@base-type")]],
      );
      assert.deepStrictEqual(
        declarationRefusals(
          item([
            el("qti-outcome-declaration", [
              attr("identifier", "RECORD"),
              attr("cardinality", " record"),
              attr("base-type", "float"),
            ]),
          ]),
        ).map(([rule, where]) => [rule, where]),
        [["attribute-type", at("qti-assessment-item/qti-outcome-declaration/@cardinality")]],
      );
    });

    it("align-54 reserved outcomes E39a: refuses a single, multiple or ordered declaration of each kind that writes no base-type, as missing-attribute at the declaration (reading 158)", () => {
      for (const kind of variableKinds) {
        for (const cardinality of ["single", "multiple", "ordered"]) {
          const source = item([
            el(kind, [attr("identifier", "UNTYPED"), attr("cardinality", cardinality)]),
          ]);

          assert.deepStrictEqual(
            declarationRefusals(source),
            [
              [
                "missing-attribute",
                at(`qti-assessment-item/${kind}`),
                { attribute: "base-type", element: kind, reading: "158" },
              ],
            ],
            `${kind} ${cardinality}`,
          );
        }
      }
      assert.deepStrictEqual(
        found(
          testDeclaring([
            el("qti-outcome-declaration", [
              attr("identifier", "TOTAL"),
              attr("cardinality", "single"),
            ]),
          ]),
          generatedTables,
        ),
        [["missing-attribute", at("qti-assessment-test/qti-outcome-declaration")]],
      );
    });

    it("align-54 reserved outcomes E39a: admits a record declaration with no base-type, and leaves one whose cardinality spells no cardinality to the value domain alone (reading 158)", () => {
      for (const kind of variableKinds) {
        assert.deepStrictEqual(
          declarationRefusals(
            item([el(kind, [attr("identifier", "RECORD"), attr("cardinality", "record")])]),
          ),
          [],
          kind,
        );
        assert.deepStrictEqual(
          declarationRefusals(
            item([el(kind, [attr("identifier", "UNTYPED"), attr("cardinality", "many")])]),
          ).map(([rule, where]) => [rule, where]),
          [["attribute-type", at(`qti-assessment-item/${kind}/@cardinality`)]],
          kind,
        );
      }
    });
  });

  describe("align-54 interaction rows: a default hotspot's place, a position object's least count, a lookup table's outcome, a declaration read as written, and an empty card (readings 80, 92, 100, 157 and 158, and P5)", () => {
    it("align-54 interaction rows E5: refuses a default hotspot choice that is not the last hotspot of its hotspot or graphic order interaction as misplaced-element, and admits one last, before trailing text (reading 80)", () => {
      for (const interaction of ["qti-hotspot-interaction", "qti-graphic-order-interaction"]) {
        const path = `qti-assessment-item/qti-item-body/${interaction}/qti-hotspot-choice[1]`;

        assert.deepStrictEqual(
          judged(
            graphicItem(
              interaction,
              hotspot("qti-hotspot-choice", "ELSEWHERE", "default"),
              hotspot("qti-hotspot-choice", "TOWN", "circle"),
            ),
          ),
          [["misplaced-element", at(path), defaultHotspot("qti-hotspot-choice", interaction)]],
          interaction,
        );
        assert.deepStrictEqual(
          judged(
            graphicItem(
              interaction,
              hotspot("qti-hotspot-choice", "TOWN", "circle"),
              hotspot("qti-hotspot-choice", "ELSEWHERE", "default"),
              text("\n  "),
            ),
          ),
          [],
          `${interaction}, default last`,
        );
        assert.deepStrictEqual(
          judged(
            graphicItem(
              interaction,
              hotspot("qti-hotspot-choice", "ELSEWHERE", " default"),
              hotspot("qti-hotspot-choice", "TOWN", "circle"),
            ),
          ).map(([rule, where]) => [rule, where]),
          [["attribute-type", at(`${path}/@shape`)]],
          `${interaction}, a shape that spells no shape`,
        );
      }
    });

    it("align-54 interaction rows E5: refuses a default associable hotspot in a graphic gap match interaction, last or not, as misplaced-element, and admits one anywhere in a graphic associate interaction (reading 80)", () => {
      const interaction = "qti-graphic-gap-match-interaction";

      assert.deepStrictEqual(
        judged(
          graphicItem(
            interaction,
            hotspot("qti-associable-hotspot", "TOWN", "circle"),
            hotspot("qti-associable-hotspot", "ELSEWHERE", "default"),
          ),
        ),
        [
          [
            "misplaced-element",
            at(`qti-assessment-item/qti-item-body/${interaction}/qti-associable-hotspot[2]`),
            defaultHotspot("qti-associable-hotspot", interaction),
          ],
        ],
      );
      assert.deepStrictEqual(
        judged(
          graphicItem(
            "qti-graphic-associate-interaction",
            hotspot("qti-associable-hotspot", "ELSEWHERE", "default"),
            hotspot("qti-associable-hotspot", "TOWN", "circle"),
          ),
        ),
        [],
      );
    });

    it('align-54 interaction rows E11b: refuses min-choices="0" on a position object interaction as attribute-type, and admits 1 and none written (reading 92)', () => {
      const refusals = judged(positioned(attr("min-choices", "0")));

      assert.deepStrictEqual(
        refusals.map(([rule, where]) => [rule, where]),
        [
          [
            "attribute-type",
            at(
              "qti-assessment-item/qti-item-body/qti-position-object-stage/qti-position-object-interaction/@min-choices",
            ),
          ],
        ],
      );
      assert.strictEqual(refusals[0]?.[2]["reading"], "92");
      assert.strictEqual(refusals[0]?.[2]["expected"], "an integer at least 1");
      assert.deepStrictEqual(judged(positioned(attr("min-choices", "1"))), []);
      assert.deepStrictEqual(judged(positioned()), []);
    });

    it("align-54 interaction rows E15: refuses a lookup table under an outcome that is not single as misplaced-element, the research probe p100-multiple-table among them, and leaves a cardinality that spells none to the value domain alone (reading 100)", () => {
      assert.deepStrictEqual(
        judged(lookedUp("SCORE", "multiple", Option.some("float"), matchTable)),
        [
          [
            "misplaced-element",
            lookupTable("qti-match-table"),
            lookupCardinality("qti-match-table", "SCORE"),
          ],
        ],
      );
      assert.deepStrictEqual(
        judged(lookedUp("GRADE", "ordered", Option.some("float"), interpolationTable)),
        [
          [
            "misplaced-element",
            lookupTable("qti-interpolation-table"),
            lookupCardinality("qti-interpolation-table", "GRADE"),
          ],
        ],
      );
      assert.deepStrictEqual(judged(lookedUp("GRADE", "record", Option.none(), matchTable)), [
        [
          "misplaced-element",
          lookupTable("qti-match-table"),
          lookupCardinality("qti-match-table", "GRADE"),
        ],
      ]);
      assert.deepStrictEqual(
        [matchTable, interpolationTable].map((held) =>
          judged(lookedUp("SCORE", "single", Option.some("float"), held)),
        ),
        [[], []],
      );
      assert.deepStrictEqual(
        judged(lookedUp("GRADE", " multiple", Option.some("float"), matchTable)).map(
          ([rule, where]) => [rule, where],
        ),
        [["attribute-type", at("qti-assessment-item/qti-outcome-declaration/@cardinality")]],
      );
    });

    it("align-54 interaction rows E40b: reads a response declaration's base-type and cardinality exactly as written for its mapping and area mapping, so one that spells nothing, or a base type unwritten, is refused alone (readings 157 and 158)", () => {
      const declaration = "qti-assessment-item/qti-response-declaration";

      assert.deepStrictEqual(ruled(mappingItem("single", Option.some(" file"), mapping)), [
        ["attribute-type", at(`${declaration}/@base-type`)],
      ]);
      assert.deepStrictEqual(ruled(mappingItem(" record", Option.none(), mapping)), [
        ["attribute-type", at(`${declaration}/@cardinality`)],
      ]);
      for (const base of [" point", "bogus"]) {
        assert.deepStrictEqual(
          ruled(mappingItem("single", Option.some(base), areaMapping)),
          [["attribute-type", at(`${declaration}/@base-type`)]],
          base,
        );
      }
      assert.deepStrictEqual(ruled(mappingItem("single", Option.none(), areaMapping)), [
        ["missing-attribute", at(declaration)],
      ]);
      assert.deepStrictEqual(ruled(mappingItem("record", Option.some("point"), areaMapping)), [
        ["unknown-attribute", at(`${declaration}/@base-type`)],
        ["misplaced-element", at(`${declaration}/qti-area-mapping`)],
      ]);
    });

    it("align-54 interaction rows P5: admits a card and a card entry with no content, as the operator ruled", () => {
      assert.deepStrictEqual(found(carded()), []);
      assert.deepStrictEqual(found(carded(el("qti-card-entry"))), []);
      assert.deepStrictEqual(
        found(carded(el("qti-card-entry"), el("qti-html-content", [], [text("A word.")]))),
        [],
      );
    });
  });

  describe("align-54 HTML rows: ARIA roles, a bdo's direction, media sources and URLs, a subtitles track, MIME types and language tags (readings 9, 123, 124, 125, 129 and 135)", () => {
    it("align-54 HTML rows D5: refuses a role on a source as unknown-attribute, and an h1's role other than heading, tab or presentation as attribute-type, and leaves an h2 every role the XSD lists (reading 9)", () => {
      assert.deepStrictEqual(
        judged(
          bodied(
            el(
              "video",
              [],
              [el("source", [attr("src", "clip.mp4"), attr("role", "presentation")])],
            ),
          ),
        ),
        [
          [
            "unknown-attribute",
            inBody("video/source/@role"),
            { attribute: "role", element: "source", reading: "9" },
          ],
        ],
      );
      assert.deepStrictEqual(cited(bodied(el("h1", [attr("role", "banner")], [text("Maps")]))), [
        ["attribute-type", inBody("h1/@role"), "9"],
      ]);
      for (const role of ["heading", "tab", "presentation"]) {
        assert.deepStrictEqual(
          judged(bodied(el("h1", [attr("role", role)], [text("Maps")]))),
          [],
          role,
        );
      }
      assert.deepStrictEqual(
        judged(bodied(el("h2", [attr("role", "banner")], [text("Maps")]))),
        [],
      );
    });

    it('align-54 HTML rows E26: refuses a bdo with no dir as missing-attribute, and dir="auto" on it as attribute-type, and admits ltr and rtl, and auto on another element (reading 123)', () => {
      const overridden = (...attributes: readonly SourceAttribute[]) =>
        bodied(el("p", [], [el("bdo", attributes, [text("abc")])]));

      assert.deepStrictEqual(judged(overridden()), [
        [
          "missing-attribute",
          inBody("p/bdo"),
          { attribute: "dir", element: "bdo", reading: "123" },
        ],
      ]);
      assert.deepStrictEqual(cited(overridden(attr("dir", "auto"))), [
        ["attribute-type", inBody("p/bdo/@dir"), "123"],
      ]);
      for (const dir of ["ltr", "rtl"]) {
        assert.deepStrictEqual(judged(overridden(attr("dir", dir))), [], dir);
      }
      assert.deepStrictEqual(judged(bodied(el("p", [attr("dir", "auto")], [text("abc")]))), []);
    });

    it("align-54 HTML rows E27: refuses a picture's source with no srcset, and an audio's or a video's source with no src, as missing-attribute, and admits each with it (reading 124)", () => {
      assert.deepStrictEqual(
        judged(
          bodied(
            el(
              "div",
              [],
              [el("picture", [], [el("source", [attr("type", "image/webp")]), pictureImage])],
            ),
          ),
        ),
        [
          [
            "missing-attribute",
            inBody("div/picture/source"),
            { attribute: "srcset", element: "source", reading: "124" },
          ],
        ],
      );
      assert.deepStrictEqual(
        judged(
          bodied(
            el(
              "div",
              [],
              [el("picture", [], [el("source", [attr("srcset", "map.webp")]), pictureImage])],
            ),
          ),
        ),
        [],
      );
      for (const media of ["audio", "video"]) {
        assert.deepStrictEqual(
          judged(bodied(el(media, [], [el("source", [attr("type", `${media}/ogg`)])]))),
          [
            [
              "missing-attribute",
              inBody(`${media}/source`),
              { attribute: "src", element: "source", reading: "124" },
            ],
          ],
          media,
        );
        assert.deepStrictEqual(
          judged(bodied(el(media, [], [el("source", [attr("src", "clip.ogg")])]))),
          [],
          `${media}, with src`,
        );
      }
    });

    it('align-54 HTML rows E27: refuses a blank media URL, src=" " among them, as attribute-type, and admits one padded with spaces (reading 124, and reading 125 for a track\'s src)', () => {
      const blanks = [
        [el("audio", [attr("src", " ")]), "audio/@src", "124"],
        [el("video", [attr("src", "")]), "video/@src", "124"],
        [el("video", [attr("poster", "\t")]), "video/@poster", "124"],
        [el("video", [], [el("source", [attr("src", " ")])]), "video/source/@src", "124"],
        [
          el(
            "div",
            [],
            [el("picture", [], [el("source", [attr("srcset", " \n ")]), pictureImage])],
          ),
          "div/picture/source/@srcset",
          "124",
        ],
        [
          el("video", [], [el("track", [attr("kind", "captions"), attr("src", " ")])]),
          "video/track/@src",
          "125",
        ],
      ] as const;

      for (const [content, step, reading] of blanks) {
        assert.deepStrictEqual(
          cited(bodied(content)),
          [["attribute-type", inBody(step), reading]],
          step,
        );
      }
      assert.deepStrictEqual(
        judged(bodied(el("video", [attr("src", " clip.mp4 "), attr("poster", "\tstill.png")]))),
        [],
      );
    });

    it('align-54 HTML rows E28: refuses a track with no kind, or kind="subtitles", and no srclang as missing-attribute, and admits a track of another kind without one (reading 125)', () => {
      for (const kind of [[], [attr("kind", "subtitles")]]) {
        assert.deepStrictEqual(
          judged(trackedVideo(...kind)),
          [
            [
              "missing-attribute",
              inBody("video/track"),
              { attribute: "srclang", element: "track", reading: "125" },
            ],
          ],
          kind.length === 0 ? "no kind" : "subtitles",
        );
      }
      assert.deepStrictEqual(judged(trackedVideo(attr("srclang", "en"))), []);
      for (const kind of ["captions", "chapters", "descriptions", "metadata"]) {
        assert.deepStrictEqual(judged(trackedVideo(attr("kind", kind))), [], kind);
      }
    });

    it('align-54 HTML rows E35: refuses a MIME type that is not two tokens joined by a slash, type="image /png" among them, as attribute-type, and admits image/svg+xml, */* and a padded upload list (reading 135)', () => {
      const typedAt = (mime: string) =>
        [
          [
            bodied(
              el("p", [], [el("a", [attr("href", "x.html"), attr("type", mime)], [text("x")])]),
            ),
            "p/a/@type",
          ],
          [
            bodied(el("div", [], [el("object", [attr("data", "x.svg"), attr("type", mime)])])),
            "div/object/@type",
          ],
          [
            bodied(
              el(
                "div",
                [],
                [
                  el(
                    "object",
                    [attr("data", "x.svg"), attr("type", "image/svg+xml")],
                    [
                      el("param", [
                        attr("name", "n"),
                        attr("value", "v"),
                        attr("valuetype", "DATA"),
                        attr("type", mime),
                      ]),
                    ],
                  ),
                ],
              ),
            ),
            "div/object/param/@type",
          ],
          [
            bodied(el("video", [], [el("source", [attr("src", "clip.mp4"), attr("type", mime)])])),
            "video/source/@type",
          ],
          [
            bodied(
              el("qti-upload-interaction", [
                attr("response-identifier", "RESPONSE"),
                attr("type", `text/plain ${mime}`),
              ]),
            ),
            "qti-upload-interaction/@type",
          ],
        ] as const;

      for (const mime of ["image /png", " image/png", "image/png ", "a b/c", "image/png\u007F"]) {
        for (const [source, step] of typedAt(mime)) {
          const where = inBody(step);
          const listed = step.startsWith("qti-upload-interaction");
          if (listed && mime !== "image/png\u007F") {
            continue;
          }

          assert.deepStrictEqual(
            cited(source),
            [["attribute-type", where, "135"]],
            `${step}: ${JSON.stringify(mime)}`,
          );
        }
      }
      for (const mime of ["image/svg+xml", "*/*", "IMAGE/PNG", "application/vnd.ms-excel"]) {
        for (const [source, step] of typedAt(mime)) {
          assert.deepStrictEqual(judged(source), [], `${step}: ${mime}`);
        }
      }
      assert.deepStrictEqual(
        cited(
          wholeItem([
            el("qti-stylesheet", [attr("href", "style.css"), attr("type", "text /css")]),
            el("qti-item-body"),
          ]),
        ),
        [["attribute-type", at("qti-assessment-item/qti-stylesheet/@type"), "135"]],
      );
      assert.deepStrictEqual(
        judged(
          bodied(
            el("qti-upload-interaction", [
              attr("response-identifier", "RESPONSE"),
              attr("type", " image/png  text/plain "),
            ]),
          ),
        ),
        [],
      );
    });

    it('align-54 HTML rows E32b: refuses xml:lang="en_US", lang="1en", lang="en " and srclang="" as attribute-type, and an empty xml:lang on an item or a stimulus, and admits x-none, an empty xml:lang and lang on body content, and a padded xml:lang (reading 129)', () => {
      const paragraph = (attribute: SourceAttribute) =>
        bodied(el("p", [attribute], [text("Colour")]));

      assert.deepStrictEqual(cited(paragraph(attr("lang", "en_US", xmlNamespace))), [
        ["attribute-type", inBody("p/@xml:lang"), "129"],
      ]);
      for (const tag of ["1en", "en "]) {
        assert.deepStrictEqual(
          cited(paragraph(attr("lang", tag))),
          [["attribute-type", inBody("p/@lang"), "129"]],
          JSON.stringify(tag),
        );
      }
      assert.deepStrictEqual(
        cited(
          bodied(
            el(
              "video",
              [attr("src", "clip.mp4")],
              [el("track", [attr("src", "en.vtt"), attr("srclang", "")])],
            ),
          ),
        ),
        [["attribute-type", inBody("video/track/@srclang"), "129"]],
      );
      assert.deepStrictEqual(
        cited(
          item(
            [el("qti-item-body")],
            [
              attr("identifier", "item"),
              attr("title", "Item"),
              attr("time-dependent", "false"),
              attr("lang", "", xmlNamespace),
            ],
          ),
        ),
        [["attribute-type", at("qti-assessment-item/@xml:lang"), "129"]],
      );
      assert.deepStrictEqual(
        cited(
          doc(
            location,
            el(
              "qti-assessment-stimulus",
              [attr("identifier", "S"), attr("title", "Stimulus"), attr("lang", " ", xmlNamespace)],
              [el("qti-stimulus-body", [], [el("p", [], [text("Colour")])])],
            ),
          ),
        ),
        [["attribute-type", at("qti-assessment-stimulus/@xml:lang"), "129"]],
      );
      for (const attribute of [
        attr("lang", "x-none", xmlNamespace),
        attr("lang", "", xmlNamespace),
        attr("lang", " en-GB ", xmlNamespace),
        attr("lang", ""),
        attr("lang", "zh-Hant-TW"),
      ]) {
        assert.deepStrictEqual(
          judged(paragraph(attribute)),
          [],
          `${attribute.namespace === "" ? "" : "xml:"}${attribute.local}=${JSON.stringify(attribute.value)}`,
        );
      }
    });

    it('align-54 HTML rows E32b: the manifest walk reads the same row, so it refuses xml:lang="en_US" on a LOM string its attribute wildcard admits, and admits x-none (reading 129)', () => {
      const string = `{${manifestNamespace}}manifest/{${manifestNamespace}}metadata/{${lomNamespace}}lom/{${lomNamespace}}general/{${lomNamespace}}title/{${lomNamespace}}string`;

      assert.deepStrictEqual(
        walkedManifest(titledManifest("en_US")).map((refusal) => [
          refusal.rule,
          refusal.location,
          refusal.detail["reading"],
        ]),
        [["attribute-type", at(`${string}/@xml:lang`), "129"]],
      );
      assert.deepStrictEqual(walkedManifest(titledManifest("x-none")), []);
    });

    describe("the manifest walk's corpus control", { tags: ["corpus"] }, () => {
      it.effect(
        'align-54 HTML rows E32b: admits the languages of BBQsTest.zip\'s manifest, whose LOM strings write xml:lang="x-none" (reading 129)',
        () =>
          Effect.gen(function* manifestLanguages() {
            const path = "qtiv3-examples/packaging/BBQsTest/BBQsTest.zip.d/imsmanifest.xml";
            const source = yield* readCorpusFile(path).pipe(
              Effect.flatMap((bytes) => readSource(path, bytes)),
            );
            const languages = [...walkDocument(source)].flatMap(({ element: walked }) =>
              walked.attributes.filter(
                (attribute) => attribute.namespace === xmlNamespace && attribute.local === "lang",
              ),
            );

            assert.include(
              languages.map((attribute) => attribute.value),
              "x-none",
            );
            assert.deepStrictEqual(
              walkedManifest(source).filter(
                (refusal) =>
                  refusal.location.kind === "path" && refusal.location.path.endsWith("/@xml:lang"),
              ),
              [],
            );
          }),
      );
    });
  });

  describe("a printed variable's format (readings 132 and 161, and the operator's P1)", () => {
    it("align-54 value grammars B2c: refuses %q, %u, a conversion with no code and a trailing %, as attribute-type at format (reading 132)", () => {
      for (const format of [
        "%q",
        "%u",
        "%5.2",
        "%",
        "2f%",
        "%i of %",
        "Score: %",
        "%%%",
        "%i%q",
        "100% sure",
        "%%%%%",
      ]) {
        const source = printed(format);

        assert.deepStrictEqual(
          found(source, generatedTables),
          [["attribute-type", at("qti-printed-variable/@format")]],
          JSON.stringify(format),
        );
        assert.deepStrictEqual(
          first(source, generatedTables)?.detail,
          formatDetail(format),
          format,
        );
      }
    });

    it("align-54 value grammars P1a, B2b.1: accepts %d, several conversions, %%, text around a conversion and a format of text alone (readings 132 and 161, the operator's P1)", () => {
      for (const format of [
        "%d",
        "%d %d",
        "%i of %i",
        "Score: %.1f",
        "100%%",
        "Points",
        "",
        "%.1f%%",
        "%%",
        "2f",
        "%%%e%%%G",
        "%i, %.2f and %#x",
        "%05d of %-3d",
        "%%d",
      ]) {
        assert.deepStrictEqual(found(printed(format), generatedTables), [], JSON.stringify(format));
      }
    });

    it("align-54 value grammars P1a: accepts a format padded at either end, its tabs and line breaks replaced, as text around the conversion (reading 161)", () => {
      for (const format of [" %.1f", "%.1f ", "\t%i", "%i\n"]) {
        assert.deepStrictEqual(found(printed(format), generatedTables), [], JSON.stringify(format));
      }
    });

    it("[I-5] admits a precision of a point and no digit, %.f and %#8.E among them, which the information model's syntax admits (info.txt:8686) and pantry R38 refuses", () => {
      for (const format of ["%.f", "%#8.E", "%.i"]) {
        assert.deepStrictEqual(found(printed(format), generatedTables), [], format);
      }
    });

    it("[I-5] admits one whole printf conversion, %.1f, %i, %08.3e and %-8X among them, and a printed variable with no format (reading 132)", () => {
      for (const format of [
        "%.1f",
        "%i",
        "%08.3e",
        "%-8X",
        "% .1f",
        "%#o",
        "%+.2E",
        "%g",
        "%10G",
        "%.0r",
        "%R",
        "%x",
        "%\t.1f",
      ]) {
        assert.deepStrictEqual(found(printed(format), generatedTables), [], JSON.stringify(format));
      }
      assert.deepStrictEqual(
        found(literal("qti-printed-variable", attr("identifier", "SCORE")), generatedTables),
        [],
      );
    });

    it("[I-5] refuses %q at format on a printed variable inside an item body, and leaves a text entry interaction's format unchecked (reading 132)", () => {
      // The response declaration gives the text entry's `response-identifier`, an IDREF, the ID it
      // names (reading 14), so the case refuses the format alone.
      const source = item([
        idResponse,
        el(
          "qti-item-body",
          [],
          [
            el(
              "p",
              [],
              [
                el("qti-printed-variable", [attr("identifier", "SCORE"), attr("format", "%q")]),
                el("qti-text-entry-interaction", [
                  attr("response-identifier", "RESPONSE"),
                  attr("format", "%q"),
                ]),
              ],
            ),
          ],
        ),
      ]);

      assert.deepStrictEqual(mistyped(source), [
        at("qti-assessment-item/qti-item-body/p/qti-printed-variable/@format"),
      ]);
    });

    it(
      "[I-5] admits exactly the formats the quadratic pattern admits, every string of at most 5 characters over %, #, 0, space, +, -, 1, 9, ., f, i, d and q (review 079e8c44 P2-13)",
      () => {
        const strings = stringsUpTo(formatAlphabet, 5);
        const disagreeing = strings.filter(
          (format) =>
            quadraticPrintfFormat.test(format) !==
            (found(printed(format), generatedTables).length === 0),
        );

        assert.strictEqual(strings.length, 402_234);
        assert.deepStrictEqual(disagreeing, []);
      },
      formatEquivalenceTimeoutMs,
    );

    it.effect(
      "[I-5] refuses a format of %, 64,000 zeros and q as attribute-type at format, 8 times the zeros in under 32 times the time (review 079e8c44 P2-13)",
      () =>
        Effect.gen(function* checksFormatInLinearTime() {
          const fewer = printed(`%${"0".repeat(formatZeros / growthFactor)}q`);
          const more = printed(`%${"0".repeat(formatZeros)}q`);
          assert.deepStrictEqual(found(more, generatedTables), [
            ["attribute-type", at("qti-printed-variable/@format")],
          ]);

          const growth = yield* growthRatio(
            () => {
              checkStructure(fewer, generatedTables);
            },
            () => {
              checkStructure(more, generatedTables);
            },
          );
          assert.isBelow(
            growth,
            growthLimit,
            `8 times the zeros took ${growth.toFixed(1)} times as long`,
          );
        }),
      formatGrowthTimeoutMs,
    );
  });

  describe("align-54 r11 default hotspot position: a default hotspot's place is read once per interaction (reading 80)", () => {
    it.effect(
      "align-54 r11 default hotspot position finding 13 (b): refuses every default hotspot choice but the last of a hotspot interaction that ends in text as misplaced-element, and checks 8 times the hotspots and text in under 32 times the time (reading 80)",
      () =>
        Effect.gen(function* checksDefaultHotspotsInLinearTime() {
          const more = fewerDefaultHotspots * growthFactor;
          const fewerSource = crowdedHotspots(fewerDefaultHotspots, "default");
          const moreSource = crowdedHotspots(more, "default");
          const refused = judged(moreSource);
          assert.strictEqual(refused.length, more - 1);
          assert.deepStrictEqual(refused[0], [
            "misplaced-element",
            crowdedHotspot(1),
            defaultHotspot("qti-hotspot-choice", "qti-hotspot-interaction"),
          ]);
          assert.deepStrictEqual(refused.at(-1)?.[1], crowdedHotspot(more - 1));

          const growth = yield* growthRatio(
            () => {
              checkStructure(fewerSource, generatedTables);
            },
            () => {
              checkStructure(moreSource, generatedTables);
            },
          );
          assert.isBelow(
            growth,
            growthLimit,
            `8 times the hotspots and text took ${growth.toFixed(1)} times as long`,
          );
        }),
      hotspotGrowthTimeoutMs,
    );

    it.effect(
      "align-54 r11 default hotspot position finding 13 (b): checks a hotspot interaction of 16,000 default hotspot choices and then 16,000 text runs in under twice the thread CPU of the same interaction with rect hotspot choices (reading 80)",
      () =>
        Effect.gen(function* checksHostileHotspotsPromptly() {
          const defaults = crowdedHotspots(hostileDefaultHotspots, "default");
          const rects = crowdedHotspots(hostileDefaultHotspots, "rect");
          assert.strictEqual(judged(defaults).length, hostileDefaultHotspots - 1);
          assert.deepStrictEqual(judged(rects), []);

          let defaultsMs = Number.POSITIVE_INFINITY;
          let rectsMs = Number.POSITIVE_INFINITY;
          for (let run = 0; run < growthRuns; run += 1) {
            const defaultsRun = yield* cpuMillis(() => {
              checkStructure(defaults, generatedTables);
            });
            const rectsRun = yield* cpuMillis(() => {
              checkStructure(rects, generatedTables);
            });
            defaultsMs = Math.min(defaultsMs, defaultsRun);
            rectsMs = Math.min(rectsMs, rectsRun);
          }
          assert.isBelow(
            defaultsMs,
            2 * rectsMs,
            `the default hotspots took ${defaultsMs.toFixed(0)} ms, the rect ones ${rectsMs.toFixed(0)} ms`,
          );
        }),
      hotspotGrowthTimeoutMs,
    );
  });

  describe("the XSD instance attributes", () => {
    it("[I-0] admits xsi:noNamespaceSchemaLocation on the root and on a body p", () => {
      const source = item(
        [
          el(
            "qti-item-body",
            [],
            [el("p", [attr("noNamespaceSchemaLocation", "local.xsd", xsiNamespace)])],
          ),
        ],
        [
          attr("noNamespaceSchemaLocation", "imsqti_asiv3p0p1_v1p0.xsd", xsiNamespace),
          attr("identifier", "item"),
        ],
      );

      assert.deepStrictEqual(found(source), []);
    });
  });

  describe("reading 47: xsi:type and xsi:nil, judged as XML Schema judges them", () => {
    it("[I-0] admits xsi:type naming the declared type or a type derived from it, with an attribute wildcard and without", () => {
      const { elements, types } = generatedTables;

      assert.isDefined(elements["p"]?.anyAttribute);
      assert.isUndefined(elements["qti-null"]?.anyAttribute);
      assert.deepStrictEqual(elements["p"]?.types, [qtiType("HTMLTextDType")]);
      assert.deepStrictEqual(elements["qti-null"]?.types, [qtiType("EmptyPrimitiveTypeDType")]);

      const weight = types["WeightDType"];
      assert.isDefined(weight);
      assert.deepStrictEqual(derivationOf(weight), {
        base: qtiType("EmptyPrimitiveTypeDType"),
        derivation: "extension",
      });
      for (const [name, written, attributes] of [
        ["p", "q:HTMLTextDType", []],
        ["qti-null", "q:EmptyPrimitiveTypeDType", []],
        ["qti-null", "q:WeightDType", weightAttributes],
        ["qti-null", " q:WeightDType\n", weightAttributes],
      ] as const) {
        assert.deepStrictEqual(
          found(typed(name, written, [], attributes), generatedTables),
          [],
          `${name} ${written}`,
        );
      }
    });

    it("[I-0] admits a type derived through a chain of extensions and restrictions on an element with an attribute wildcard", () => {
      // No type in the committed tables derives from the type of an element with an attribute
      // wildcard, so this chain is hand-built.
      const chained: Tables = {
        elements: { probe: element({ anyAttribute: anyLax, types: qti("ProbeDType") }) },
        types: {
          DeepProbeDType: {
            ...noContent,
            base: qtiType("WideProbeDType"),
            derivation: "restriction",
          },
          ProbeDType: { ...noContent, base: xsdType("anyType"), derivation: "restriction" },
          WideProbeDType: { ...noContent, base: qtiType("ProbeDType"), derivation: "extension" },
        },
      };

      for (const written of ["q:ProbeDType", "q:WideProbeDType", "q:DeepProbeDType"]) {
        assert.deepStrictEqual(found(typed("probe", written), chained), [], written);
      }
      assert.deepStrictEqual(found(typed("probe", "q:OtherDType"), chained), [
        ["attribute-type", at(typePath("probe"))],
      ]);
    });

    it("[I-0] resolves the type's prefix through the declarations in scope, the default namespace included", () => {
      const path = `qti-response-processing/qti-set-outcome-value/${typePath("qti-null")}`;

      assert.deepStrictEqual(
        found(
          nestedNull([attr("q", qtiNamespace, xmlnsNamespace)], "q:WeightDType", weightAttributes),
          generatedTables,
        ),
        [],
      );
      assert.deepStrictEqual(
        found(
          nestedNull(
            [attr("xmlns", qtiNamespace, xmlnsNamespace)],
            "WeightDType",
            weightAttributes,
          ),
          generatedTables,
        ),
        [],
      );
      // With no default namespace in scope an unprefixed name is in no namespace, so it names no
      // QTI type.
      assert.deepStrictEqual(found(nestedNull([], "WeightDType"), generatedTables), [
        ["attribute-type", at(path)],
      ]);
    });

    it("[I-0] refuses xsi:type naming an unrelated QTI type, an unbound prefix or xs:string as attribute-type, with an attribute wildcard and without", () => {
      const unrelated = "ChoiceInteractionDType";

      for (const [name, declared] of [
        ["p", "HTMLTextDType"],
        ["qti-null", "EmptyPrimitiveTypeDType"],
      ] as const) {
        assert.notInclude(ancestry(unrelated), declared);
        for (const written of [`q:${unrelated}`, `z:${declared}`, "xs:string", `q:${declared}:x`]) {
          const refusals = checkStructure(typed(name, written), generatedTables);

          assert.deepStrictEqual(
            refusals.map((refusal) => [refusal.rule, refusal.location]),
            [["attribute-type", at(typePath(name))]],
            `${name} ${written}`,
          );
          assert.strictEqual(refusals[0]?.detail["reading"], "47");
          assert.include(refusals[0]?.detail["expected"], declared);
        }
      }
    });

    it("[I-0] refuses xsi:nil as unknown-attribute whatever its value, with an attribute wildcard and without", () => {
      for (const name of ["p", "qti-null"]) {
        for (const nil of ["true", "false"]) {
          const refusals = checkStructure(
            doc(location, el(name, [attr("nil", nil, xsiNamespace)])),
            generatedTables,
          );

          assert.deepStrictEqual(
            refusals.map((refusal) => [refusal.rule, refusal.location]),
            [["unknown-attribute", at(`${name}/@{${xsiNamespace}}nil`)]],
            `${name} ${nil}`,
          );
          assert.strictEqual(refusals[0]?.detail["reading"], "47");
        }
      }
    });

    it("[I-0] still admits the two location attributes, and judges nothing on an element the walk does not check", () => {
      for (const name of ["p", "qti-null"]) {
        const located = doc(
          location,
          el(name, [
            attr("schemaLocation", `${qtiNamespace} qti.xsd`, xsiNamespace),
            attr("noNamespaceSchemaLocation", "qti.xsd", xsiNamespace),
            attr("type", "&t;", xsiNamespace, ["t"]),
          ]),
        );

        assert.deepStrictEqual(found(located, generatedTables), [], name);
      }

      assert.isDefined(generatedTables.elements["qti-custom-operator"]?.anyElement);

      const unwalked = doc(
        location,
        el("qti-custom-operator", declarations, [
          el(
            "widget",
            [
              attr("type", "q:ChoiceInteractionDType", xsiNamespace),
              attr("nil", "true", xsiNamespace),
            ],
            [],
            otherNamespace,
          ),
        ]),
      );

      assert.deepStrictEqual(found(unwalked, generatedTables), []);
    });

    it("[I-0] admits xsi:type xs:ENTITY unverified where the declared type is one it derives from (reading 50)", () => {
      // xs:ENTITY restricts xs:NCName, which restricts xs:Name, xs:token and xs:normalizedString in
      // turn (XML Schema Part 2, section 3.3).
      assert.deepStrictEqual(generatedTables.elements["qti-description"]?.types, [
        xsdType("normalizedString"),
      ]);
      for (const written of ["xs:ENTITY", "xs:token", "xs:normalizedString"]) {
        const described = typed("qti-description", written, [text("calculator")]);

        assert.deepStrictEqual(found(described, generatedTables), [], written);
      }

      // xs:integer is no base of xs:ENTITY: the refusal names the declared type, never an entity.
      assert.deepStrictEqual(generatedTables.elements["qti-minimum-length"]?.types, [
        xsdType("integer"),
      ]);

      const refusals = checkStructure(
        typed("qti-minimum-length", "xs:ENTITY", [text("4")]),
        generatedTables,
      );

      assert.deepStrictEqual(
        refusals.map((refusal) => [refusal.rule, refusal.location]),
        [["attribute-type", at(typePath("qti-minimum-length"))]],
      );
      assert.include(refusals[0]?.detail["expected"], "integer");
      assert.notInclude(refusals[0]?.detail["expected"]?.toLowerCase(), "entity");
    });
  });

  describe("AD-9: the named type governs after a valid xsi:type", () => {
    it("[I-0] checks a qti-null typed qti:WeightDType by WeightDType's table, not by its name's", () => {
      assert.deepStrictEqual(
        found(governedNull("qti:WeightDType", weightAttributes), generatedTables),
        [],
      );
      assert.deepStrictEqual(
        found(governedNull("qti:WeightDType", [attr("identifier", "W")]), generatedTables),
        [["missing-attribute", at(governedPath)]],
      );
      assert.deepStrictEqual(
        found(
          governedNull("qti:EmptyPrimitiveTypeDType", [attr("identifier", "W")]),
          generatedTables,
        ),
        [["unknown-attribute", at(`${governedPath}/@identifier`)]],
      );
    });

    it("governingTables gives a typed element its type's table and an untyped one its name's", () => {
      const source = governedNull("qti:WeightDType", weightAttributes);
      const governing = governingTables(source, generatedTables);
      const setter = "qti-assessment-item/qti-response-processing/qti-set-outcome-value";

      assert.strictEqual(
        governing.get(elementAt(source, governedPath)),
        generatedTables.types["WeightDType"],
      );
      assert.strictEqual(
        governing.get(elementAt(source, setter)),
        generatedTables.elements["qti-set-outcome-value"],
      );
    });

    it("governingTables gives a name declared with several types the named type's own table, not the union", () => {
      assert.deepStrictEqual(generatedTables.elements["qti-feedback-block"]?.types, [
        qtiType("FeedbackBlockDType"),
        qtiType("TemplateBlockFeedbackBlockDType"),
      ]);

      const source = typed("qti-feedback-block", "q:TemplateBlockFeedbackBlockDType");

      assert.strictEqual(
        governingTables(source, generatedTables).get(source.root),
        generatedTables.types["TemplateBlockFeedbackBlockDType"],
      );
    });

    it("governingTables keeps the name's table for a qti-description typed xs:token, a type of XML Schema's", () => {
      const source = typed("qti-description", "xs:token", [text("calculator")]);

      assert.deepStrictEqual(found(source, generatedTables), []);
      assert.strictEqual(
        governingTables(source, generatedTables).get(source.root),
        generatedTables.elements["qti-description"],
      );
    });

    it("admits a typed element's children and text by the named type's table, and by its name's when the type is invalid", () => {
      // No type in the committed tables widens its base's children, so this pair is hand-built.
      const widened: Tables = {
        elements: {
          leaf: element({ types: qti("LeafDType") }),
          probe: element({ types: qti("ProbeDType") }),
        },
        types: {
          LeafDType: { ...noContent, base: xsdType("anyType"), derivation: "restriction" },
          ProbeDType: { ...noContent, base: xsdType("anyType"), derivation: "restriction" },
          WideProbeDType: {
            ...noContent,
            base: qtiType("ProbeDType"),
            children: qti("leaf"),
            derivation: "extension",
            text: true,
          },
        },
      };
      const content = [el("leaf", []), text("words")];

      assert.deepStrictEqual(found(typed("probe", "q:WideProbeDType", content), widened), []);
      assert.deepStrictEqual(found(typed("probe", "q:OtherDType", content), widened), [
        ["attribute-type", at(typePath("probe"))],
        ["text-not-allowed", at("probe")],
        ["unknown-element", at("probe/leaf")],
      ]);
    });
  });

  describe("lax wildcard content, walked as XML Schema assesses it (rule 5b8ee08b, reading 6)", () => {
    it("relies on the committed tables: lax wildcards, global names and the faults' declarations", () => {
      const lax: Wildcard = { namespace: "##any", process: "lax" };

      assert.deepStrictEqual(generatedTables.elements["qti-custom-interaction"]?.anyElement, lax);
      assert.deepStrictEqual(generatedTables.elements["template"]?.anyElement, lax);
      assert.deepStrictEqual(generatedTables.elements["qti-ordering"]?.anyElement, {
        namespace: "##other",
        process: "lax",
      });
      for (const local of ["div", "p", "qti-assessment-item"]) {
        assert.isTrue(generatedTables.elements[local]?.global, local);
      }
      for (const local of ["qti-choice-interaction", "qti-simple-choice"]) {
        assert.isFalse(generatedTables.elements[local]?.global, local);
      }
      for (const local of ["div", "p", "qti-choice-interaction"]) {
        assert.isTrue(declaresId(local), local);
      }
      assert.isUndefined(generatedTables.elements["div"]?.anyElement);
      assert.isFalse(
        generatedTables.elements["div"]?.children.some(
          (child) => child.local === "qti-simple-choice",
        ) ?? true,
      );
    });

    it("[I-8] checks a global QTI element a lax wildcard admits by its table, in a custom interaction and in a template", () => {
      assert.deepStrictEqual(found(customized(badDiv), generatedTables), [
        ["attribute-type", at(`${custom}/div/@id`)],
      ]);
      assert.deepStrictEqual(found(customized(el("div", [], [looseChoice])), generatedTables), [
        ["unknown-element", at(`${custom}/div/qti-simple-choice`)],
      ]);
      assert.deepStrictEqual(found(templated(badDiv), generatedTables), [
        ["attribute-type", at(`${markupTemplate}/div/@id`)],
      ]);
      assert.deepStrictEqual(found(templated(el("div", [], [looseChoice])), generatedTables), [
        ["unknown-element", at(`${markupTemplate}/div/qti-simple-choice`)],
      ]);
    });

    it("[I-8] passes over a QTI element declared only locally, and admits its children laxly", () => {
      const choice = (...children: readonly SourceChild[]) =>
        customized(
          el("qti-choice-interaction", [attr("response-identifier", "RESPONSE"), badId], children),
        );

      assert.deepStrictEqual(found(choice(), generatedTables), []);
      assert.deepStrictEqual(found(choice(el("p")), generatedTables), []);
      assert.deepStrictEqual(found(choice(el("p", [badId])), generatedTables), [
        ["attribute-type", at(`${custom}/qti-choice-interaction/p/@id`)],
      ]);
    });

    it("[I-8] passes over a QTI root nested in lax content with everything below it (reading 6)", () => {
      const nested = el(
        "qti-assessment-item",
        [attr("identifier", "1x"), attr("time-dependent", "false"), attr("title", "Nested")],
        [badDiv],
      );

      assert.deepStrictEqual(found(customized(nested), generatedTables), []);
    });

    it("[I-8] admits laxly the children of an element in another namespace, under ##any and under ##other", () => {
      const widget = el("widget", [], [badDiv], otherNamespace);

      assert.deepStrictEqual(found(customized(widget), generatedTables), [
        ["attribute-type", at(`${custom}/{${otherNamespace}}widget/div/@id`)],
      ]);
      assert.deepStrictEqual(found(ordered(widget), generatedTables), [
        ["attribute-type", at(`${ordering}/{${otherNamespace}}widget/div/@id`)],
      ]);
    });

    it("[I-8] accepts foreign content whose xsi:type names a resolved complex type without checking it (reading 50)", () => {
      const widget = (written: string) =>
        el(
          "widget",
          [...declarations, attr("type", written, xsiNamespace)],
          [badDiv],
          otherNamespace,
        );
      const fault = ["attribute-type", at(`${custom}/{${otherNamespace}}widget/div/@id`)] as const;

      // WeightDType requires `identifier` and `value` and admits no child, so it would refuse this.
      assert.deepStrictEqual(found(customized(widget("q:WeightDType")), generatedTables), []);
      assert.deepStrictEqual(found(customized(widget("xs:anyType")), generatedTables), [fault]);
      assert.deepStrictEqual(found(customized(widget("q:NoSuchDType")), generatedTables), [fault]);
      // A prefix nothing binds is refused itself (reading 83), and the content stays lax.
      assert.deepStrictEqual(found(customized(widget("z:WeightDType")), generatedTables), [
        ["attribute-type", at(`${custom}/{${otherNamespace}}widget/@{${xsiNamespace}}type`)],
        fault,
      ]);
    });

    it('relies on the committed tables: the simple and complex types the cases of reading 60 ("a simple type it names governs its text and is checked") name', () => {
      assert.deepStrictEqual(
        [
          generatedTables.types["MimeTypeListDType"],
          generatedTables.types["MimeTypeDType"],
          generatedTables.types["BaseValueDType"],
        ].map((entry) => (entry !== undefined && "base" in entry ? entry.base : undefined)),
        [qtiType("MimeTypeDType"), xsdType("normalizedString"), xsdType("string")],
      );
      assert.deepStrictEqual(
        ["MimeTypeListDType", "MimeTypeDType", "BaseValueDType", "ToleranceListDType"].map(
          (local) => generatedTables.types[local]?.derivation,
        ),
        ["restriction", "restriction", "extension", "union"],
      );
    });

    it('[I-8] refuses an attribute and a child element on foreign content typed by a simple type, and leaves its text unchecked, plate\'s open limit that reading 60 ("a simple type it names governs its text and is checked") records', () => {
      const widgetPath = `${custom}/{${otherNamespace}}widget`;
      const widget = (
        written: string,
        attributes: readonly SourceAttribute[],
        ...children: readonly SourceChild[]
      ) =>
        customized(
          el(
            "widget",
            [...declarations, attr("type", written, xsiNamespace), ...attributes],
            children,
            otherNamespace,
          ),
        );
      const foreign = attr("foreign", "1", otherNamespace);
      const lang = attr("lang", "en", xmlNamespace);
      const schemaLocation = attr("schemaLocation", `${otherNamespace} other.xsd`, xsiNamespace);

      for (const written of [
        "xs:string",
        "xs:integer",
        "q:MimeTypeListDType",
        "q:ToleranceListDType",
      ]) {
        assert.deepStrictEqual(
          found(widget(written, [], badDiv), generatedTables),
          [["unknown-element", at(`${widgetPath}/div`)]],
          written,
        );
        assert.deepStrictEqual(
          found(widget(written, [], el("part", [], [], otherNamespace)), generatedTables),
          [["unknown-element", at(`${widgetPath}/{${otherNamespace}}part`)]],
          written,
        );
        assert.deepStrictEqual(
          found(widget(written, [foreign, attr("size", "3"), lang]), generatedTables),
          [
            ["unknown-attribute", at(`${widgetPath}/@{${otherNamespace}}foreign`)],
            ["unknown-attribute", at(`${widgetPath}/@size`)],
            ["unknown-attribute", at(`${widgetPath}/@xml:lang`)],
          ],
          written,
        );
        assert.deepStrictEqual(
          found(
            widget(written, [schemaLocation], text("not a number, nor a MIME type")),
            generatedTables,
          ),
          [],
          written,
        );
      }
    });

    it('[I-8] cites reading 60 ("a simple type it names governs its text and is checked") on the refusals of foreign content typed by a simple type', () => {
      const source = customized(
        el(
          "widget",
          [...declarations, attr("type", "xs:string", xsiNamespace), attr("size", "3")],
          [badDiv],
          otherNamespace,
        ),
      );
      const widget = `{${otherNamespace}}widget`;

      assert.deepStrictEqual(
        checkStructure(source, generatedTables).map((refusal) => refusal.detail),
        [
          { attribute: "size", element: widget, reading: "60" },
          { element: "div", parent: widget, reading: "60" },
        ],
      );
    });

    it("[I-8] keeps foreign content typed by a complex type unchecked whatever it holds, simple content included (reading 50)", () => {
      for (const written of ["q:WeightDType", "q:BaseValueDType"]) {
        const source = customized(
          el(
            "widget",
            [
              ...declarations,
              attr("type", written, xsiNamespace),
              attr("foreign", "1", otherNamespace),
            ],
            [badDiv, el("part", [], [], otherNamespace), text("text")],
            otherNamespace,
          ),
        );

        assert.deepStrictEqual(found(source, generatedTables), [], written);
      }
    });

    it("governingTables gives the lax-checked elements, and not the ones passed over", () => {
      const checkedDiv = customized(badDiv);
      const choice = customized(
        el("qti-choice-interaction", [attr("response-identifier", "RESPONSE")], [el("p")]),
      );
      const nested = customized(
        el(
          "qti-assessment-item",
          [attr("identifier", "item"), attr("time-dependent", "false"), attr("title", "Nested")],
          [badDiv],
        ),
      );
      const choicePath = `${custom}/qti-choice-interaction`;

      assert.strictEqual(
        governingTables(checkedDiv, generatedTables).get(elementAt(checkedDiv, `${custom}/div`)),
        generatedTables.elements["div"],
      );
      assert.strictEqual(
        governingTables(choice, generatedTables).get(elementAt(choice, `${choicePath}/p`)),
        generatedTables.elements["p"],
      );
      assert.isFalse(governingTables(choice, generatedTables).has(elementAt(choice, choicePath)));
      assert.isFalse(
        governingTables(nested, generatedTables).has(
          elementAt(nested, `${custom}/qti-assessment-item`),
        ),
      );
    });
  });

  describe("reading 61 (\"an element in QTI's own namespace inside `qti-ordering`'s extension slot is valid\"): the slot read as ##any, laxly", () => {
    it("relies on the committed tables: qti-weight is declared only locally, and qti-selection's slot is ##other lax too", () => {
      assert.isFalse(generatedTables.elements["qti-weight"]?.global ?? true);
      assert.deepStrictEqual(generatedTables.elements["qti-selection"]?.anyElement, {
        namespace: "##other",
        process: "lax",
      });
    });

    it("passes over a QTI element declared only locally in qti-ordering's slot as foreign content, and admits its children laxly", () => {
      const weight = el("qti-weight", [attr("identifier", "W"), attr("value", "2")]);
      const holding = ordered(el("qti-weight", [attr("identifier", "W")], [badDiv, looseChoice]));
      const governing = governingTables(holding, generatedTables);

      assert.deepStrictEqual(found(ordered(weight), generatedTables), []);
      assert.deepStrictEqual(found(holding, generatedTables), [
        ["attribute-type", at(`${ordering}/qti-weight/div/@id`)],
      ]);
      assert.isFalse(governing.has(elementAt(holding, `${ordering}/qti-weight`)));
      assert.isTrue(governing.has(elementAt(holding, `${ordering}/qti-weight/div`)));
    });

    it("still refuses a QTI element in qti-selection's slot, which reading 61 (\"an element in QTI's own namespace inside `qti-ordering`'s extension slot is valid\") does not cover", () => {
      const weight = el("qti-weight", [attr("identifier", "W"), attr("value", "2")]);

      assert.deepStrictEqual(found(selected(weight), generatedTables), [
        ["unknown-element", at(`${selection}/qti-weight`)],
      ]);
    });
  });

  describe("align-54 wildcards: qti-ordering's slot read laxly, strict wildcards and xsi:type, and the order after a repeated wildcard (readings 61, 81, 83, 96 and 113)", () => {
    it("relies on the committed tables: the strict wildcards of the companion materials, a file's metadata and accessForAllResource, and the global names the cases read", () => {
      const strict: Wildcard = { namespace: "##other", process: "strict" };
      const profile = packageTables.get("3.0.0");
      const drd = profile?.get(drdNamespace);
      const packaging = profile?.get(manifestNamespace);

      assert.deepStrictEqual(
        generatedTables.elements["qti-companion-materials-info"]?.anyElement,
        strict,
      );
      assert.deepStrictEqual(packaging?.elements["metadata"]?.anyElement, strict);
      assert.deepStrictEqual(drd?.elements["accessForAllResource"]?.anyElement, strict);
      assert.isTrue(drd?.elements["accessForAllResource"]?.global);
      assert.isTrue(packaging?.elements["manifest"]?.global);
      assert.isFalse(profile?.has(otherNamespace) ?? true);
      assert.isFalse(profile?.has(qtiNamespace) ?? true);
      assert.isTrue(generatedTables.elements["p"]?.extensionCovered);
    });

    it("align-54 wildcards D9: checks a global QTI element in qti-ordering's slot by its table, as lax assessment reads it (reading 61)", () => {
      const checkedDiv = ordered(badDiv);

      assert.deepStrictEqual(found(ordered(el("p", [attr("onclick", "go()")])), generatedTables), [
        ["unknown-attribute", at(`${ordering}/p/@onclick`)],
      ]);
      assert.deepStrictEqual(found(checkedDiv, generatedTables), [
        ["attribute-type", at(`${ordering}/div/@id`)],
      ]);
      assert.deepStrictEqual(found(ordered(el("div", [], [looseChoice])), generatedTables), [
        ["unknown-element", at(`${ordering}/div/qti-simple-choice`)],
      ]);
      assert.strictEqual(
        governingTables(checkedDiv, generatedTables).get(elementAt(checkedDiv, `${ordering}/div`)),
        generatedTables.elements["div"],
      );
    });

    it("align-54 wildcards D9: keeps a QTI element no global declaration names in qti-ordering's slot as foreign content, its attributes unchecked and its children admitted laxly, and a nested QTI root unchecked (readings 61 and 6)", () => {
      const choice = el("qti-simple-choice", [attr("unknown", "x")], [badDiv]);
      const nested = el(
        "qti-assessment-item",
        [attr("identifier", "1x"), attr("time-dependent", "false"), attr("title", "Nested")],
        [badDiv],
      );

      assert.deepStrictEqual(found(ordered(choice), generatedTables), [
        ["attribute-type", at(`${ordering}/qti-simple-choice/div/@id`)],
      ]);
      assert.deepStrictEqual(found(ordered(nested), generatedTables), []);
    });

    it("align-54 wildcards D9: admits an element of no namespace in qti-ordering's slot laxly, as the slot is read as ##any (reading 61)", () => {
      assert.deepStrictEqual(found(ordered(el("loose", [], [badDiv], "")), generatedTables), [
        ["attribute-type", at(`${ordering}/{}loose/div/@id`)],
      ]);
    });

    it("align-54 wildcards E6: refuses an element a strict wildcard holds that no table declares and no xsi:type types, as unknown-element: the research probes a81_strict_foreign and a81_strict_drd (reading 81)", () => {
      const drd = el("educationalComplexityOfAdaptation", [], [text("x")], drdV2Namespace);

      assert.deepStrictEqual(
        checkStructure(companioned(foreignWidget([], text("a"))), generatedTables).map(
          (refusal) => [refusal.rule, refusal.location, refusal.detail],
        ),
        [
          [
            "unknown-element",
            at(`${companion}/${widgetStep}`),
            { element: widgetStep, parent: "qti-companion-materials-info", reading: "81" },
          ],
        ],
      );
      assert.deepStrictEqual(found(companioned(drd), generatedTables), [
        [
          "unknown-element",
          at(`${companion}/${stepIn(drdV2Namespace, "educationalComplexityOfAdaptation")}`),
        ],
      ]);
    });

    it("align-54 wildcards E6: refuses an element under a strict wildcard whose xsi:type names no type, bound or not, or is no QName, as unknown-element: the research probe a81_strict_xsitype_unknown (reading 81)", () => {
      for (const written of ["o:Nope", "zz:Nope", "xs:Nope", "1x"]) {
        assert.deepStrictEqual(
          found(companioned(foreignWidget([instanceType(written)], text("abc"))), generatedTables),
          [["unknown-element", at(`${companion}/${widgetStep}`)]],
          written,
        );
      }
    });

    it('align-54 wildcards E6: admits an element under a strict wildcard that an xsi:type types, as lax assessment reads it: the research probes a81_strict_xsitype and a81_strict_xsitype_int_bad, whose text stays unchecked, plate\'s open limit that reading 60 ("a simple type it names governs its text and is checked") records (reading 81)', () => {
      const typedWidget = `${companion}/${widgetStep}`;

      assert.deepStrictEqual(
        found(companioned(foreignWidget([instanceType("xs:string")], text("a"))), generatedTables),
        [],
      );
      assert.deepStrictEqual(
        found(
          companioned(foreignWidget([instanceType("xs:integer")], text("abc"))),
          generatedTables,
        ),
        [],
      );
      assert.deepStrictEqual(
        found(
          companioned(foreignWidget([instanceType("xs:string"), attr("size", "3")])),
          generatedTables,
        ),
        [["unknown-attribute", at(`${typedWidget}/@size`)]],
      );
      assert.deepStrictEqual(
        found(companioned(foreignWidget([instanceType("q:WeightDType")], badDiv)), generatedTables),
        [],
      );
      assert.deepStrictEqual(
        found(companioned(foreignWidget([instanceType("xs:anyType")], badDiv)), generatedTables),
        [["attribute-type", at(`${typedWidget}/div/@id`)]],
      );
    });

    it("align-54 wildcards E6: keeps MathML, SSML and XInclude under a strict wildcard unwalked, which the item's schema set declares and plate holds no tables for: the research probes a81_strict_math_bad and a81_strict_ssml_ok (reading 81)", () => {
      const math = el("math", [], [el("bogus", [], [], mathmlNamespace)], mathmlNamespace);
      const speak = el("speak", [attr("version", "1.1")], [text("a")], ssmlNamespace);
      const include = el("include", [attr("href", "a.xml")], [], xincludeNamespace);

      assert.deepStrictEqual(found(companioned(math, speak, include), generatedTables), []);
    });

    it("align-54 wildcards E6: checks a global of the manifest's schema set under a file's strict metadata wildcard by its table, keeps a nested manifest under accessForAllResource's foreign, and refuses a QTI root, which that set does not declare (readings 81 and 113)", () => {
      const nestedManifest = el(
        "manifest",
        [],
        [el("stray", [], [], manifestNamespace)],
        manifestNamespace,
      );
      const root = el("qti-assessment-item", [attr("identifier", "I")]);

      assert.deepStrictEqual(
        walkedManifest(packaged([], [accessForAll(foreignWidget([], text("a")))])).map(
          (refusal) => [refusal.rule, refusal.location],
        ),
        [["unknown-element", at(`${packagedFile}/${accessForAllStep}/${widgetStep}`)]],
      );
      assert.deepStrictEqual(walkedManifest(packaged([], [accessForAll(nestedManifest)])), []);
      assert.deepStrictEqual(
        walkedManifest(packaged([], [root])).map((refusal) => [refusal.rule, refusal.location]),
        [["unknown-element", at(`${packagedFile}/qti-assessment-item`)]],
      );
      // A manifest in the file metadata's own namespace is no element its `##other` admits.
      assert.deepStrictEqual(
        walkedManifest(packaged([], [nestedManifest])).map((refusal) => [
          refusal.rule,
          refusal.location,
        ]),
        [["unknown-element", at(`${packagedFile}/${stepIn(manifestNamespace, "manifest")}`)]],
      );
    });

    it("align-54 wildcards E6: reads a global of the manifest's schema set in a LOM element's lax wildcard by its declaration, where it was kept foreign, and keeps a nested manifest there foreign (readings 81 and 6)", () => {
      const nestedManifest = el(
        "manifest",
        [],
        [el("stray", [], [], manifestNamespace)],
        manifestNamespace,
      );

      assert.deepStrictEqual(
        walkedManifest(packaged([accessForAll(foreignWidget([], text("a")))], [])).map(
          (refusal) => [refusal.rule, refusal.location],
        ),
        [["unknown-element", at(`${packagedGeneral}/${accessForAllStep}/${widgetStep}`)]],
      );
      assert.deepStrictEqual(walkedManifest(packaged([nestedManifest], [])), []);
    });

    it("align-54 wildcards E6: checks a global of another namespace's tables in lax wildcard content by its table, where it was kept foreign, and leaves a local one to lax assessment (reading 81)", () => {
      const nested = customized(el("box", [], [badDiv], xNamespace));
      const local = customized(el("part", [], [badDiv], xNamespace));
      const box = `${custom}/${xStep("box")}`;

      assert.deepStrictEqual(foundWith(nested, generatedTables), [
        ["missing-attribute", at(box)],
        ["attribute-type", at(`${box}/div/@id`)],
      ]);
      assert.deepStrictEqual(found(nested, generatedTables), [
        ["attribute-type", at(`${box}/div/@id`)],
      ]);
      assert.deepStrictEqual(foundWith(local, generatedTables), [
        ["attribute-type", at(`${custom}/${xStep("part")}/div/@id`)],
      ]);
      assert.strictEqual(
        governingTables(nested, generatedTables, others).get(elementAt(nested, box)),
        xTables.elements["box"],
      );
    });

    it("align-54 wildcards E6: refuses an xsi:type on foreign content under a lax wildcard whose prefix no declaration in scope binds, or that is no QName, as attribute-type, and admits its children laxly: the research probe a83_xsitype_unbound_foreign (readings 83 and 47)", () => {
      const unbound = el("widget", [instanceType("zz:Foo")], [badDiv], otherNamespace);
      const instancePath = `${custom}/${widgetStep}/@{${xsiNamespace}}type`;

      assert.deepStrictEqual(found(customized(unbound), generatedTables), [
        ["attribute-type", at(instancePath)],
        ["attribute-type", at(`${custom}/${widgetStep}/div/@id`)],
      ]);
      assert.deepStrictEqual(checkStructure(customized(unbound), generatedTables)[0]?.detail, {
        attribute: `{${xsiNamespace}}type`,
        element: widgetStep,
        expected: "a QName whose prefix a namespace declaration in scope binds",
        reading: "83",
        value: "zz:Foo",
      });
      assert.deepStrictEqual(
        checkStructure(customized(foreignWidget([instanceType("1x")])), generatedTables).map(
          (refusal) => [refusal.rule, refusal.location, refusal.detail["reading"]],
        ),
        [["attribute-type", at(instancePath), "47"]],
      );
      assert.deepStrictEqual(
        found(customized(foreignWidget([instanceType("o:Nope")], text("a"))), generatedTables),
        [],
      );
    });

    it("align-54 wildcards E13: refuses a companion material after a child the repeated strict wildcard holds as misplaced-element, check order, and admits one before it (reading 96)", () => {
      const speak = el("speak", [attr("version", "1.1")], [text("a")], ssmlNamespace);
      const math = el("math", [], [], mathmlNamespace);

      assert.deepStrictEqual(
        checkStructure(
          companioned(physicalMaterial(), speak, physicalMaterial()),
          generatedTables,
        ).map((refusal) => [refusal.rule, refusal.location, refusal.detail]),
        [
          [
            "misplaced-element",
            at(`${companion}/qti-physical-material[2]`),
            {
              check: "order",
              context: "qti-companion-materials-info",
              element: "qti-physical-material",
              reading: "96",
            },
          ],
        ],
      );
      assert.deepStrictEqual(found(companioned(math, physicalMaterial()), generatedTables), [
        ["misplaced-element", at(`${companion}/qti-physical-material`)],
      ]);
      assert.deepStrictEqual(
        found(companioned(physicalMaterial(), physicalMaterial(), speak, math), generatedTables),
        [],
      );
    });

    it("align-54 wildcards E13: refuses a manifest accessForAllResource's isPartialAdaptationOf after a child its repeated strict wildcard holds as misplaced-element, check order, and admits one before it (reading 96)", () => {
      const partial = el("isPartialAdaptationOf", [], [text("urn:example:item")], drdNamespace);
      const held = foreignWidget([instanceType("xs:string")], text("a"));
      const partialStep = stepIn(drdNamespace, "isPartialAdaptationOf");

      assert.deepStrictEqual(
        walkedManifest(packaged([], [accessForAll(held, partial)])).map((refusal) => [
          refusal.rule,
          refusal.location,
          refusal.detail,
        ]),
        [
          [
            "misplaced-element",
            at(`${packagedFile}/${accessForAllStep}/${partialStep}`),
            {
              check: "order",
              context: accessForAllStep,
              element: partialStep,
              reading: "96",
            },
          ],
        ],
      );
      assert.deepStrictEqual(walkedManifest(packaged([], [accessForAll(partial, held)])), []);
    });
  });

  describe('reading 56 ("an `xs:double` literal beyond the largest finite double names the largest finite double of its sign"): one reader of xs:double', () => {
    it("[I-2] admits normal-maximum 1e400 and INF, and refuses -1e400, 0e0, -0 and NaN (reading 16)", () => {
      const path = "qti-assessment-item/qti-outcome-declaration/@normal-maximum";

      for (const admitted of ["1e400", "INF"]) {
        assert.deepStrictEqual(found(item([outcome(attr("normal-maximum", admitted))])), []);
      }
      for (const refused of ["-1e400", "0e0", "-0", "NaN"]) {
        const source = item([outcome(attr("normal-maximum", refused))]);

        assert.deepStrictEqual(found(source), [["attribute-type", at(path)]]);
      }
    });

    it("admits a qti-time-limits max-time of 1e400 and refuses -1e400 (minInclusive 0.0)", () => {
      assert.deepStrictEqual(found(limits("1e400"), generatedTables), []);
      assert.deepStrictEqual(found(limits("-1e400"), generatedTables), [
        ["attribute-type", at("qti-time-limits/@max-time")],
      ]);
    });

    it("reads a double only through the value model, with no reader of its own", () => {
      const walk = readFileSync(
        new URL(import.meta.resolve("#plate/validate/structure.ts")),
        "utf-8",
      );

      assert.notInclude(walk, "readDouble");
      assert.notInclude(walk, "Number(");
    });
  });

  describe("other namespaces' tables", () => {
    it("checks an element of another namespace its parent's table names by that namespace's table, and passes over it without them", () => {
      const named: Tables = {
        elements: {
          ...tables.elements,
          "qti-item-body": element({ children: [xName("box"), ...qti("p")] }),
        },
        types: {},
      };
      const source = body(
        el(
          "box",
          [attr("name", "b")],
          [
            el("part", [attr("size", "x")], [text("1")], xNamespace),
            el("stray", [], [], xNamespace),
          ],
          xNamespace,
        ),
      );
      const box = `qti-assessment-item/qti-item-body/${xStep("box")}`;

      assert.deepStrictEqual(foundWith(source, named), [
        ["attribute-type", at(`${box}/${xStep("part")}/@size`)],
        ["unknown-element", at(`${box}/${xStep("stray")}`)],
      ]);
      assert.deepStrictEqual(found(source, named), []);
    });

    it("checks a root in another namespace by its own table, and leaves it to the verdict without them", () => {
      const nameless = doc(
        location,
        el("box", [], [el("part", [], [text("1")], xNamespace)], xNamespace),
      );
      const crate = doc(location, el("crate", [], [], xNamespace));

      assert.deepStrictEqual(foundWith(nameless), [["missing-attribute", at(xStep("box"))]]);
      assert.deepStrictEqual(foundWith(crate), [["unknown-element", at(xStep("crate"))]]);
      assert.deepStrictEqual(found(nameless), []);
      assert.deepStrictEqual(found(crate), []);
    });

    it("reads ##other in another namespace's table as any namespace but that one, QTI's included", () => {
      const source = doc(
        location,
        el(
          "box",
          [attr("name", "b")],
          [
            badDiv,
            el("loose", [], [], ""),
            el("stray", [], [], xNamespace),
            el("widget", [], [badDiv], otherNamespace),
          ],
          xNamespace,
        ),
      );
      const box = xStep("box");

      assert.deepStrictEqual(foundWith(source, generatedTables), [
        ["attribute-type", at(`${box}/div/@id`)],
        ["unknown-element", at(`${box}/{}loose`)],
        ["unknown-element", at(`${box}/${xStep("stray")}`)],
        ["attribute-type", at(`${box}/{${otherNamespace}}widget/div/@id`)],
      ]);
    });

    it("judges xsi:type and xsi:nil on another namespace's element, and lets a type its tables derive govern it", () => {
      const wide = xBox(attr("type", "x:WideBoxType", xsiNamespace), attr("width", "3"));
      const plain = xBox(attr("width", "3"));
      const root = xStep("box");

      assert.deepStrictEqual(foundWith(wide), []);
      assert.deepStrictEqual(foundWith(plain), [["unknown-attribute", at(`${root}/@width`)]]);
      assert.deepStrictEqual(foundWith(xBox(attr("type", "xs:string", xsiNamespace))), [
        ["attribute-type", at(typePath(root))],
      ]);
      assert.deepStrictEqual(foundWith(xBox(attr("nil", "true", xsiNamespace))), [
        ["unknown-attribute", at(`${root}/@{${xsiNamespace}}nil`)],
      ]);
      assert.strictEqual(
        governingTables(wide, tables, others).get(wide.root),
        xTables.types["WideBoxType"],
      );
      assert.strictEqual(
        governingTables(plain, tables, others).get(plain.root),
        xTables.elements["box"],
      );
    });

    it("applies none of QTI's readings to another namespace's elements", () => {
      const source = doc(
        location,
        el(
          "tag",
          [attr("data-Foo", "1"), attr("max-choices", "9223372036854775808")],
          [],
          xNamespace,
        ),
      );

      assert.deepStrictEqual(foundWith(source), []);
    });
  });
  describe("align-54 ID table: the document's IDs are one table, and an IDREF names one of them (readings 14, 74, 84, 101, 109 and 156)", () => {
    it("align-54 ID table E16: refuses a second element with one id as duplicate-identifier, its id collapsed as its type reads it (reading 101)", () => {
      assert.deepStrictEqual(
        idFound(
          idItem([], [el("p", [attr("id", "a")], [text("x")]), el("div", [attr("id", " a ")])]),
        ),
        [["duplicate-identifier", at(`${idBody}/div/@id`), { identifier: "a", reading: "101" }]],
      );
      assert.deepStrictEqual(
        idFound(
          idItem([], [el("p", [attr("id", "a")], [text("x")]), el("div", [attr("id", "b")])]),
        ),
        [],
      );
    });

    it("align-54 ID table E16: an id that is no NCName is no ID: its value domain alone refuses it, nothing repeats it and no IDREF names it (reading 156)", () => {
      const refusals = idFound(
        idItem(
          [],
          [
            el("p", [attr("id", "1a")], [text("x")]),
            el("div", [attr("id", "1a"), attr("aria-labelledby", "1a")]),
          ],
        ),
      );

      assert.deepStrictEqual(
        refusals.map(([rule, where, detail]) => [rule, where, detail["check"]]),
        [
          ["attribute-type", at(`${idBody}/p/@id`), undefined],
          ["attribute-type", at(`${idBody}/div/@id`), undefined],
          ["attribute-type", at(`${idBody}/div/@aria-labelledby`), undefined],
          ["attribute-type", at(`${idBody}/div/@aria-labelledby`), "idref-target"],
        ],
      );
    });

    it("align-54 ID table E16: refuses an IDREF, and each token of a list of IDREFs, that names no id of the document as attribute-type, idref-target, and resolves one that names a later id", () => {
      assert.deepStrictEqual(
        idFound(
          idItem(
            [],
            [
              el("div", [attr("aria-describedby", "a b"), attr("aria-activedescendant", "z")]),
              el("p", [attr("aria-labelledby", "later")], [text("x")]),
              el("p", [attr("id", "a")], [text("y")]),
              el("div", [attr("id", "later")]),
            ],
          ),
        ),
        [
          [
            "attribute-type",
            at(`${idBody}/div[1]/@aria-describedby`),
            idrefTarget("div", "aria-describedby", "b"),
          ],
          [
            "attribute-type",
            at(`${idBody}/div[1]/@aria-activedescendant`),
            idrefTarget("div", "aria-activedescendant", "z"),
          ],
        ],
      );
    });

    it("align-54 ID table E16: refuses a text entry's response-identifier under qti-null's xsi:type that names no ID, as the governing type makes it an IDREF (reading 84): the research probe a84_null_textentry_idref", () => {
      assert.deepStrictEqual(idFound(idNulled("NOPE")), [
        [
          "attribute-type",
          at(`${idSetting}/qti-null/@response-identifier`),
          idrefTarget("qti-null", "response-identifier", "NOPE"),
        ],
      ]);
      assert.deepStrictEqual(idFound(idNulled("RESPONSE")), []);
    });

    it("align-54 ID table E16: refuses a wildcard xml:id on an element whose governing type declares an ID, written or not, as unknown-attribute (reading 109): the research probes p109a and p109d", () => {
      const exited = `${idProcessing}/qti-exit-response`;
      const wild = [
        "unknown-attribute",
        at(`${exited}/@xml:id`),
        { attribute: "xml:id", element: "qti-exit-response", reading: "109" },
      ] as const;

      assert.deepStrictEqual(idFound(idExit(attr("id", "b", xmlNamespace))), [wild]);
      assert.deepStrictEqual(idFound(idExit(attr("id", "a"), attr("id", "b", xmlNamespace))), [
        wild,
      ]);
      assert.deepStrictEqual(idFound(idExit()), []);
    });

    it("align-54 ID table E16: a wildcard xml:id where the governing type declares no ID is one of the document's IDs: an IDREF resolves to it, and another element may not repeat it (reading 109)", () => {
      const operator = idSet(el("qti-custom-operator", [attr("id", "w", xmlNamespace)]));

      assert.deepStrictEqual(
        idFound(
          idItem([idScore], [el("p", [attr("aria-labelledby", "w")], [text("x")])], [operator]),
        ),
        [],
      );
      assert.deepStrictEqual(
        idFound(idItem([idScore], [el("p", [attr("id", "w")], [text("x")])], [operator])),
        [
          [
            "duplicate-identifier",
            at(`${idSetting}/qti-custom-operator/@xml:id`),
            { identifier: "w", reading: "101" },
          ],
        ],
      );
    });

    it("align-54 ID table D3b: refuses an element id equal to a response declaration's identifier as duplicate-identifier, and resolves a text entry's response-identifier to the declaration (reading 14): the research probe a74_resp_id", () => {
      assert.deepStrictEqual(
        idFound(idItem([idResponse], [el("p", [attr("id", "RESPONSE")], [text("x")])])),
        [
          [
            "duplicate-identifier",
            at(`${idBody}/p/@id`),
            { identifier: "RESPONSE", reading: "14" },
          ],
        ],
      );
      assert.deepStrictEqual(
        idFound(
          idItem(
            [idResponse],
            [
              el(
                "p",
                [],
                [el("qti-text-entry-interaction", [attr("response-identifier", "RESPONSE")])],
              ),
            ],
          ),
        ),
        [],
      );
    });

    it("align-54 ID table E1b: refuses an element id equal to a context declaration's identifier as duplicate-identifier (reading 74): the research probe a74_ctx_id", () => {
      assert.deepStrictEqual(
        idFound(idItem([idResponse, idContext], [el("p", [attr("id", "CTX")], [text("x")])])),
        [["duplicate-identifier", at(`${idBody}/p/@id`), { identifier: "CTX", reading: "74" }]],
      );
    });

    it("align-54 ID table E1b: leaves two of the root's declarations of one identifier to the prose rules, which refuse them as two declarations of one name (E1a)", () => {
      assert.deepStrictEqual(idFound(idItem([idResponse, renamed(idContext, "RESPONSE")], [])), []);
      assert.deepStrictEqual(idFound(idItem([idResponse, idResponse], [])), []);
    });

    it("align-54 ID table E16: does not resolve an outcome declaration's variable-identifier-ref, which reading 15 sets aside", () => {
      const referring = el("qti-outcome-declaration", [
        attr("identifier", "SCORE"),
        attr("cardinality", "single"),
        attr("base-type", "float"),
        attr("variable-identifier-ref", "EXTERNAL"),
      ]);

      assert.deepStrictEqual(idFound(idItem([referring], [])), []);
    });

    it("align-54 ID table E16: leaves an IDREF unrefused where the table cannot be complete: in a document that includes a fragment (reading 117), and where it names an id of a MathML island", () => {
      const labelled = el("p", [attr("aria-labelledby", "m1")], [text("x")]);
      const island = el(
        "math",
        [],
        [el("mi", [attr("id", "m1")], [text("y")], mathmlNamespace)],
        mathmlNamespace,
      );
      const include = el("include", [attr("href", "fragment.xml")], [], xincludeNamespace);

      assert.deepStrictEqual(idFound(idItem([], [labelled, include])), []);
      assert.deepStrictEqual(idFound(idItem([], [labelled, el("p", [], [island])])), []);
      assert.deepStrictEqual(idFound(idItem([], [labelled])), [
        [
          "attribute-type",
          at(`${idBody}/p/@aria-labelledby`),
          idrefTarget("p", "aria-labelledby", "m1"),
        ],
      ]);
    });

    it("align-54 ID table E16: judges no manifest's IDs: a repeated resource identifier and a dependency that names nothing draw no ID refusal, the manifest's own rules judging the dependency (rule db2ef322)", () => {
      const manifest = titledManifest("en");
      const resources = el(
        "resources",
        [],
        [
          idResource([el("dependency", [attr("identifierref", "NONE")], [], manifestNamespace)]),
          idResource([]),
        ],
        manifestNamespace,
      );
      const source = doc(manifest.location, {
        ...manifest.root,
        children: manifest.root.children.map((child) =>
          child.kind === "element" && child.local === "resources" ? resources : child,
        ),
      });

      assert.deepStrictEqual(
        walkedManifest(source).filter(
          (refusal) =>
            refusal.rule === "duplicate-identifier" || refusal.detail["check"] === "idref-target",
        ),
        [],
      );
    });

    it("align-54 ID table E16: a repeated id on qti-interaction-module, typed xs:NCName, is no ID (the control)", () => {
      assert.isTrue(declaresId("qti-interaction-module", "NCName"));
      assert.isTrue(declaresId("p"));
    });

    it.effect(
      "align-54 ID table E16: the fractions documents' repeated qti-interaction-module id draws no duplicate-identifier, so they stay refused only as before (the control)",
      () =>
        Effect.gen(function* fractions() {
          const path = "qtiv3-examples/packaging/pci/pci_item_examples.zip.d/fractions1.xml";
          const source = yield* readCorpusFile(path).pipe(
            Effect.flatMap((bytes) => readSource(path, bytes)),
          );
          const modules = [...walkDocument(source)].filter(
            ({ element: walked }) => walked.local === "qti-interaction-module",
          );

          assert.isAbove(modules.length, 1);
          assert.deepStrictEqual(
            checkStructure(source, generatedTables).filter(
              (refusal) =>
                refusal.rule === "duplicate-identifier" ||
                refusal.detail["check"] === "idref-target",
            ),
            [],
          );
        }),
      { tags: ["corpus"] },
    );
  });

  describe("align-54 r11 lax xml attributes: xml:id and xml:lang are assessed wherever the walk visits an element (readings 101, 129 and 156)", () => {
    it("align-54 r11 lax xml attributes finding 8: refuses a second xml:id of one value on an element passed over laxly as duplicate-identifier, and one equal to a checked element's id (reading 101)", () => {
      assert.deepStrictEqual(
        idFound(
          laxItem(
            [],
            laxWidget("w", attr("id", "a", xmlNamespace)),
            laxWidget("v", attr("id", "a", xmlNamespace)),
          ),
        ),
        [
          [
            "duplicate-identifier",
            at(`${laxInteraction}/{${otherNamespace}}v/@xml:id`),
            { identifier: "a", reading: "101" },
          ],
        ],
      );
      assert.deepStrictEqual(
        idFound(
          laxItem(
            [el("p", [attr("id", "a")], [text("x")])],
            laxWidget("w", attr("id", " a ", xmlNamespace)),
          ),
        ),
        [
          [
            "duplicate-identifier",
            at(`${laxInteraction}/{${otherNamespace}}w/@xml:id`),
            { identifier: "a", reading: "101" },
          ],
        ],
      );
    });

    it("align-54 r11 lax xml attributes finding 8: an IDREF naming the xml:id of an element passed over laxly resolves to it (reading 156)", () => {
      assert.deepStrictEqual(
        idFound(
          laxItem(
            [el("p", [attr("aria-labelledby", "lab")], [text("x")])],
            laxWidget("w", attr("id", "lab", xmlNamespace)),
          ),
        ),
        [],
      );
      assert.deepStrictEqual(
        idFound(
          laxItem(
            [el("p", [attr("aria-labelledby", "lab")], [text("x")])],
            laxWidget("w", attr("id", "lab")),
          ),
        ),
        [
          [
            "attribute-type",
            at(`${idBody}/p/@aria-labelledby`),
            idrefTarget("p", "aria-labelledby", "lab"),
          ],
        ],
      );
    });

    it("align-54 r11 lax xml attributes finding 8: refuses an xml:id that is no NCName as attribute-type, expected ID, on a qti-custom-operator whose attribute wildcard admits it and on an element passed over laxly, and it binds no ID, so two of them do not collide (reading 156)", () => {
      const operator = idSet(
        el("qti-custom-operator", [attr("class", "c"), attr("id", "1a", xmlNamespace)]),
      );
      const refusedId = (local: string) =>
        [
          "attribute-type",
          at(`${laxInteraction}/{${otherNamespace}}${local}/@xml:id`),
          {
            attribute: "xml:id",
            element: `{${otherNamespace}}${local}`,
            expected: "ID",
            value: "1a",
          },
        ] as const;

      assert.deepStrictEqual(idFound(idItem([idScore], [el("p", [], [text("x")])], [operator])), [
        [
          "attribute-type",
          at(`${idSetting}/qti-custom-operator/@xml:id`),
          { attribute: "xml:id", element: "qti-custom-operator", expected: "ID", value: "1a" },
        ],
      ]);
      assert.deepStrictEqual(
        idFound(
          laxItem(
            [],
            laxWidget("w", attr("id", "1a", xmlNamespace)),
            laxWidget("v", attr("id", "1a", xmlNamespace)),
          ),
        ),
        [refusedId("w"), refusedId("v")],
      );
    });

    it('align-54 r11 lax xml attributes finding 8: refuses xml:lang="en_US" on an element passed over laxly as reading 129\'s row refuses it on a checked one, after its unresolvable xsi:type, and admits x-none and a padded tag (reading 129)', () => {
      const at129 = (language: string) =>
        [
          "attribute-type",
          at(`${laxInteraction}/{${otherNamespace}}w/@xml:lang`),
          {
            attribute: "xml:lang",
            element: `{${otherNamespace}}w`,
            expected: "a well-formed BCP 47 language tag, or empty",
            reading: "129",
            value: language,
          },
        ] as const;

      assert.deepStrictEqual(idFound(laxLanguage("en_US")), [at129("en_US")]);
      assert.deepStrictEqual(
        idFound(laxLanguage("en_US", attr("type", "nowhere:T", xsiNamespace))).map(
          ([rule, where, detail]) => [rule, where, detail["reading"]],
        ),
        [
          [
            "attribute-type",
            at(`${laxInteraction}/{${otherNamespace}}w/@{${xsiNamespace}}type`),
            "83",
          ],
          ["attribute-type", at(`${laxInteraction}/{${otherNamespace}}w/@xml:lang`), "129"],
        ],
      );
      for (const language of ["x-none", " en-GB ", ""]) {
        assert.deepStrictEqual(idFound(laxLanguage(language)), [], JSON.stringify(language));
      }
    });

    it("align-54 r11 lax xml attributes finding 8: judges no xml:id or xml:lang in content a skip wildcard admits, which the walk never visits (the control)", () => {
      const content = [
        laxWidget("w", attr("id", "a", xmlNamespace), attr("lang", "en_US", xmlNamespace)),
        laxWidget("v", attr("id", "a", xmlNamespace)),
        laxWidget("u", attr("id", "1a", xmlNamespace)),
      ];

      assert.isNotEmpty(idFound(laxItem([], ...content)));
      assert.deepStrictEqual(
        checkStructure(laxItem([], ...content), skipping).map((refusal) => [
          refusal.rule,
          refusal.location,
        ]),
        [],
      );
    });

    it("align-54 r11 lax xml attributes finding 8: a checked element's xml:id and xml:lang are judged as before: once each, and a wildcard xml:id beside a declared ID only as reading 109 refuses it (the control)", () => {
      assert.deepStrictEqual(
        cited(bodied(el("p", [attr("lang", "en_US", xmlNamespace)], [text("Colour")]))),
        [["attribute-type", inBody("p/@xml:lang"), "129"]],
      );
      assert.deepStrictEqual(
        idFound(idItem([], [el("p", [attr("id", "1a")], [text("x")])])).map(
          ([rule, where, detail]) => [rule, where, detail["expected"]],
        ),
        [["attribute-type", at(`${idBody}/p/@id`), "ID"]],
      );
      assert.deepStrictEqual(idFound(idExit(attr("id", "1a", xmlNamespace))), [
        [
          "unknown-attribute",
          at(`${idProcessing}/qti-exit-response/@xml:id`),
          { attribute: "xml:id", element: "qti-exit-response", reading: "109" },
        ],
      ]);
      assert.deepStrictEqual(
        idFound(
          idItem(
            [idScore],
            [el("p", [attr("aria-labelledby", "w")], [text("x")])],
            [idSet(el("qti-custom-operator", [attr("id", " w ", xmlNamespace)]))],
          ),
        ),
        [],
      );
    });
  });
});

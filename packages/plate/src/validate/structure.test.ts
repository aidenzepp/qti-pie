import { readFileSync } from "node:fs";
import { assert, describe, it } from "@effect/vitest";
import { Option } from "effect";
import {
  attr,
  doc,
  el,
  entity,
  mathmlNamespace,
  qtiNamespace,
  text,
  walk as walkDocument,
  xmlNamespace,
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
    [attr("identifier", "SCORE"), attr("cardinality", "single"), attr("base-type", base)],
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
 * The path of the card {@link carded} builds.
 */
const card = "qti-assessment-item/qti-catalog-info/qti-catalog/qti-card";

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
 * Construct a test whose one section's `qti-ordering`, with its `##other` `lax` element wildcard,
 * holds the given children.
 *
 * @param children The ordering's children.
 * @returns The test as a source document.
 */
const ordered = (...children: readonly SourceChild[]): SourceDocument =>
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
              [el("qti-ordering", [], children)],
            ),
          ],
        ),
      ],
    ),
  );

/**
 * The path of the ordering {@link ordered} builds.
 */
const ordering = "qti-assessment-test/qti-test-part/qti-assessment-section/qti-ordering";

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
 * Report whether a committed element table declares `id` as an `NCName`.
 *
 * @param local The element's local name.
 * @returns Whether its table declares `id` with that type.
 */
const declaresNcNameId = (local: string): boolean =>
  generatedTables.elements[local]?.attributes.some(
    (attribute) =>
      attribute.local === "id" &&
      attribute.type.kind === "builtin" &&
      attribute.type.name === "NCName",
  ) ?? false;

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

  describe("readings 16, 17 and 18: the narrowed attributes", () => {
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

    it('[I-8] refuses min-choices="0" on an order interaction as attribute-type, and admits it on a choice interaction (reading 18)', () => {
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

  describe("readings 22, 23 and 38: placements", () => {
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

    it("[I-9b] refuses a qti-number-correct in an item's response processing as misplaced-element (reading 23)", () => {
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

    it("[I-8] refuses a qti-gap outside a qti-gap-match-interaction as misplaced-element (reading 38)", () => {
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

  describe("reading 10: both ARIA spellings", () => {
    it("[A-1] admits aria-keyshorts and aria-keyshortcuts on an img", () => {
      const source = body(
        el("img", [attr("aria-keyshorts", "Alt+K"), attr("aria-keyshortcuts", "Alt+K")]),
      );

      assert.deepStrictEqual(found(source), []);
    });
  });

  describe("readings 20, 21 and 31, and single cardinality: child counts", () => {
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

    it("refuses a card or a card entry with no content as child-count (reading 31)", () => {
      const empty = carded();
      const emptyEntry = carded(el("qti-card-entry"));

      assert.deepStrictEqual(found(empty), [["child-count", at(card)]]);
      assert.deepStrictEqual(first(empty)?.detail, {
        child: "qti-html-content or qti-file-href or qti-card-entry",
        element: "qti-card",
        required: "at least one",
        source: "reading 31",
      });
      assert.deepStrictEqual(found(emptyEntry), [["child-count", at(`${card}/qti-card-entry`)]]);
      assert.deepStrictEqual(first(emptyEntry)?.detail, {
        child: "qti-html-content or qti-file-href",
        element: "qti-card-entry",
        required: "at least one",
        source: "reading 31",
      });
      assert.deepStrictEqual(found(carded(el("qti-html-content", [], [text("A word.")]))), []);
      assert.deepStrictEqual(
        found(
          carded(
            el("qti-card-entry", [], [el("qti-file-href", [], [text("a.mp3")])]),
            el("qti-card-entry", [], [el("qti-file-href", [], [text("b.mp3")])]),
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
        assert.isTrue(declaresNcNameId(local), local);
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
      assert.deepStrictEqual(found(customized(widget("z:WeightDType")), generatedTables), [fault]);
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

  describe("R-g: one reader of xs:double", () => {
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
});

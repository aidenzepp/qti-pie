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
  xmlNamespace,
  xmlnsNamespace,
  xsiNamespace,
} from "#plate/document/source.ts";
import type { SourceAttribute, SourceChild, SourceDocument } from "#plate/document/source.ts";
import type { Location, RefusalRule } from "#plate/validate/refusal.ts";
import { checkStructure } from "#plate/validate/structure.ts";
import type {
  AttributeTable,
  AttributeType,
  BuiltinName,
  ChildName,
  ElementTable,
  Tables,
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
  text: false,
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
 * A small slice of the QTI tables, hand-built: an item, its declarations with their mappings and
 * tables, and a body with an HTML paragraph, three interactions and the PCI module list.
 */
const tables: Tables = {
  elements: {
    p: element({
      anyAttribute: anyLax,
      attributes: [optional("id", ncName)],
      children: qti("qti-text-entry-interaction"),
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
      children: qti("qti-item-body", "qti-outcome-declaration", "qti-response-declaration"),
    }),
    "qti-choice-interaction": element({
      attributes: [
        optional("max-choices", builtin("nonNegativeInteger")),
        required("response-identifier", ncName),
      ],
      children: qti("qti-simple-choice"),
    }),
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
          "p",
          "qti-choice-interaction",
          "qti-interaction-modules",
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
    "qti-outcome-declaration": element({
      attributes: [
        optional("base-type", baseType),
        required("cardinality", oneOf("single", "multiple", "ordered", "record")),
        required("identifier", ncName),
        optional("normal-maximum", builtin("double", "0.0")),
      ],
      children: qti("qti-match-table"),
    }),
    "qti-portable-custom-interaction": element({
      anyAttribute: otherLax,
      anyElement: otherLax,
      attributes: [required("response-identifier", ncName)],
    }),
    "qti-response-declaration": element({
      attributes: [
        optional("base-type", baseType),
        required("cardinality", oneOf("single", "multiple", "ordered", "record")),
        required("identifier", ncName),
      ],
      children: qti("qti-mapping"),
    }),
    "qti-simple-choice": element({ attributes: [required("identifier", ncName)], text: true }),
    "qti-slider-interaction": element({
      attributes: [
        required("lower-bound", double),
        required("response-identifier", ncName),
        required("upper-bound", double),
      ],
    }),
    "qti-text-entry-interaction": element({
      attributes: [required("response-identifier", ncName)],
    }),
  },
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
      }).length > 0,
  );

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
});

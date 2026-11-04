import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import type {
  SourceAttribute,
  SourceChild,
  SourceDocument,
  SourceElement,
} from "#plate/document/source.ts";
import {
  attr,
  doc,
  el,
  qtiNamespace,
  xmlNamespace,
  xmlnsNamespace,
  xsdNamespace,
} from "#plate/document/source.ts";
import type { AttributeType, ElementTable } from "#plate/validate/xsd.ts";
import { generateTables, patternEquivalents } from "#plate/validate/xsd.ts";

/**
 * Construct an element in the XML Schema namespace, as an XSD fragment holds it.
 *
 * @param local The XSD construct's local name, such as `complexType`.
 * @param attributes The construct's attributes, none by default.
 * @param children The construct's children, none by default.
 * @returns The XSD element.
 */
const xs = (
  local: string,
  attributes: readonly SourceAttribute[] = [],
  children: readonly SourceChild[] = [],
): SourceElement => el(local, attributes, children, xsdNamespace);

/**
 * Wrap definitions in an `xs:schema` whose target and default namespace is QTI's and which binds
 * `xs`, as the QTI XSD's root does.
 *
 * @param definitions The schema's top-level definitions.
 * @returns The fragment as a source document.
 */
const schema = (...definitions: readonly SourceElement[]): SourceDocument =>
  doc(
    "fragment.xsd",
    xs(
      "schema",
      [
        attr("xmlns", qtiNamespace, xmlnsNamespace),
        attr("xs", xsdNamespace, xmlnsNamespace),
        attr("targetNamespace", qtiNamespace),
      ],
      definitions,
    ),
  );

/**
 * Construct an `xs:attribute` from its XSD attributes, given as name and value pairs.
 *
 * @param pairs The declaration's attributes, such as `{ name: "id", type: "xs:string" }`.
 * @param children The declaration's children, such as an inline `xs:simpleType`.
 * @returns The attribute declaration.
 */
const attribute = (
  pairs: Readonly<Record<string, string>>,
  children: readonly SourceChild[] = [],
): SourceElement =>
  xs(
    "attribute",
    Object.entries(pairs).map(([local, value]) => attr(local, value)),
    children,
  );

/**
 * Construct a named `xs:complexType` that declares exactly the given children.
 *
 * @param name The type's name.
 * @param children Its attribute declarations, group references or content.
 * @returns The complex type.
 */
const complexType = (name: string, ...children: readonly SourceElement[]): SourceElement =>
  xs("complexType", [attr("name", name)], children);

/**
 * Construct a global `xs:element` of a named type.
 *
 * @param name The element's name.
 * @param type The element's type, a QName.
 * @returns The element declaration.
 */
const element = (name: string, type: string): SourceElement =>
  xs("element", [attr("name", name), attr("type", type)]);

/**
 * Generate the tables of a fragment and take one element's table.
 *
 * @param document The XSD fragment.
 * @param name The element's local name.
 * @returns The element's table, or a test failure when the tables hold no such element.
 */
const tableOf = Effect.fnUntraced(function* tableOf(document: SourceDocument, name: string) {
  const tables = yield* generateTables(document);
  const table = tables.elements[name];
  assert.isDefined(table, `the tables hold ${name}`);

  return table;
});

/**
 * The built-in type of an attribute with no facets.
 *
 * @param name The built-in's name.
 * @returns Its attribute type.
 */
const builtin = (name: "boolean" | "int" | "integer" | "NCName" | "normalizedString" | "string") =>
  ({ kind: "builtin", name }) as const;

/**
 * The table of an element with only the given attributes and no content, as `p1-08a` leaves it.
 *
 * @param attributes The element's attribute tables, sorted.
 * @returns The element table.
 */
const attributesOnly = (attributes: ElementTable["attributes"]): ElementTable => ({
  attributes,
  children: [],
  text: false,
});

describe("generateTables", () => {
  it.effect("an extension inherits its base's attributes and adds its own", () =>
    Effect.gen(function* extension() {
      const table = yield* tableOf(
        schema(
          complexType("BaseDType", attribute({ name: "id", type: "xs:string", use: "required" })),
          complexType(
            "DerivedDType",
            xs(
              "complexContent",
              [],
              [
                xs(
                  "extension",
                  [attr("base", "BaseDType")],
                  [attribute({ name: "label", type: "xs:normalizedString" })],
                ),
              ],
            ),
          ),
          element("derived", "DerivedDType"),
        ),
        "derived",
      );

      assert.deepStrictEqual(
        table,
        attributesOnly([
          { local: "id", namespace: "", type: builtin("string"), use: "required" },
          { local: "label", namespace: "", type: builtin("normalizedString"), use: "optional" },
        ]),
      );
    }),
  );

  it.effect("a restriction keeps its base's attributes and drops a prohibited one", () =>
    Effect.gen(function* restriction() {
      const table = yield* tableOf(
        schema(
          complexType(
            "BaseDType",
            attribute({ name: "id", type: "xs:string" }),
            attribute({ name: "label", type: "xs:string" }),
          ),
          complexType(
            "NarrowDType",
            xs(
              "complexContent",
              [],
              [
                xs(
                  "restriction",
                  [attr("base", "BaseDType")],
                  [attribute({ name: "label", use: "prohibited" })],
                ),
              ],
            ),
          ),
          element("narrow", "NarrowDType"),
        ),
        "narrow",
      );

      assert.deepStrictEqual(
        table,
        attributesOnly([{ local: "id", namespace: "", type: builtin("string"), use: "optional" }]),
      );
    }),
  );

  it.effect("a nested attributeGroup reference expands", () =>
    Effect.gen(function* nestedGroup() {
      const table = yield* tableOf(
        schema(
          xs(
            "attributeGroup",
            [attr("name", "inner.Attr")],
            [attribute({ default: "false", name: "b", type: "xs:boolean" })],
          ),
          xs(
            "attributeGroup",
            [attr("name", "outer.Attr")],
            [
              attribute({ name: "a", type: "xs:int" }),
              xs("attributeGroup", [attr("ref", "inner.Attr")]),
            ],
          ),
          complexType("GroupedDType", xs("attributeGroup", [attr("ref", "outer.Attr")])),
          element("grouped", "GroupedDType"),
        ),
        "grouped",
      );

      assert.deepStrictEqual(
        table,
        attributesOnly([
          { local: "a", namespace: "", type: builtin("int"), use: "optional" },
          {
            default: "false",
            local: "b",
            namespace: "",
            type: builtin("boolean"),
            use: "optional",
          },
        ]),
      );
    }),
  );

  it.effect("an enumeration keeps its values and the built-in it restricts", () =>
    Effect.gen(function* enumeration() {
      const table = yield* tableOf(
        schema(
          xs(
            "simpleType",
            [attr("name", "ShapeEnum")],
            [
              xs(
                "restriction",
                [attr("base", "xs:string")],
                [
                  xs("enumeration", [attr("value", "circle")]),
                  xs("enumeration", [attr("value", "rect")]),
                ],
              ),
            ],
          ),
          complexType(
            "AreaDType",
            attribute({ name: "shape", type: "ShapeEnum", use: "required" }),
          ),
          element("area", "AreaDType"),
        ),
        "area",
      );

      const areaKinds: AttributeType = {
        base: "string",
        kind: "enumeration",
        values: ["circle", "rect"],
      };
      assert.deepStrictEqual(
        table,
        attributesOnly([{ local: "shape", namespace: "", type: areaKinds, use: "required" }]),
      );
    }),
  );

  it.effect("a list and a union are recorded, union members from memberTypes and inline", () =>
    Effect.gen(function* listAndUnion() {
      const table = yield* tableOf(
        schema(
          complexType(
            "MixedDType",
            attribute({ name: "class" }, [
              xs("simpleType", [], [xs("list", [attr("itemType", "xs:string")])]),
            ]),
            attribute({ name: "min" }, [
              xs(
                "simpleType",
                [],
                [
                  xs(
                    "union",
                    [attr("memberTypes", "xs:integer")],
                    [xs("simpleType", [], [xs("restriction", [attr("base", "xs:NCName")])])],
                  ),
                ],
              ),
            ]),
          ),
          element("mixed", "MixedDType"),
        ),
        "mixed",
      );

      assert.deepStrictEqual(
        table,
        attributesOnly([
          {
            local: "class",
            namespace: "",
            type: { item: builtin("string"), kind: "list" },
            use: "optional",
          },
          {
            local: "min",
            namespace: "",
            type: { kind: "union", members: [builtin("integer"), builtin("NCName")] },
            use: "optional",
          },
        ]),
      );
    }),
  );

  it.effect("minInclusive and a known pattern are recorded on the built-in they restrict", () =>
    Effect.gen(function* facets() {
      const table = yield* tableOf(
        schema(
          xs(
            "simpleType",
            [attr("name", "ARIALevelIntegerDType")],
            [
              xs(
                "restriction",
                [attr("base", "xs:integer")],
                [xs("minInclusive", [attr("value", "1")])],
              ),
            ],
          ),
          xs(
            "simpleType",
            [attr("name", "LengthDType")],
            [
              xs(
                "restriction",
                [attr("base", "xs:string")],
                [xs("pattern", [attr("value", "[0-9]+%?")])],
              ),
            ],
          ),
          complexType(
            "HeadingDType",
            attribute({ name: "aria-level", type: "ARIALevelIntegerDType" }),
            attribute({ name: "width", type: "LengthDType" }),
          ),
          element("heading", "HeadingDType"),
        ),
        "heading",
      );

      assert.deepStrictEqual(
        table,
        attributesOnly([
          {
            local: "aria-level",
            namespace: "",
            type: { kind: "builtin", minInclusive: "1", name: "integer" },
            use: "optional",
          },
          {
            local: "width",
            namespace: "",
            type: { base: "string", kind: "pattern", pattern: "[0-9]+%?" },
            use: "optional",
          },
        ]),
      );
    }),
  );

  it.effect("a pattern with no JavaScript equivalent fails with TableGenerationError", () =>
    Effect.gen(function* unknownPattern() {
      const error = yield* generateTables(
        schema(
          xs(
            "simpleType",
            [attr("name", "LowerDType")],
            [
              xs(
                "restriction",
                [attr("base", "xs:string")],
                [xs("pattern", [attr("value", "[a-z]+")])],
              ),
            ],
          ),
          complexType("LowerHolderDType", attribute({ name: "code", type: "LowerDType" })),
          element("holder", "LowerHolderDType"),
        ),
      ).pipe(Effect.flip);

      assert.strictEqual(error._tag, "TableGenerationError");
      assert.strictEqual(error.construct, "xs:pattern");
    }),
  );

  it.effect("a facet other than enumeration, pattern and minInclusive fails, naming it", () =>
    Effect.gen(function* unknownFacet() {
      const error = yield* generateTables(
        schema(
          xs(
            "simpleType",
            [attr("name", "ShortDType")],
            [
              xs(
                "restriction",
                [attr("base", "xs:string")],
                [xs("maxLength", [attr("value", "5")])],
              ),
            ],
          ),
          complexType("ShortHolderDType", attribute({ name: "code", type: "ShortDType" })),
          element("holder", "ShortHolderDType"),
        ),
      ).pipe(Effect.flip);

      assert.strictEqual(error._tag, "TableGenerationError");
      assert.strictEqual(error.construct, "xs:maxLength");
    }),
  );

  it.effect('ref="xml:lang" is recorded in the XML namespace, typed as a string', () =>
    Effect.gen(function* xmlLang() {
      const table = yield* tableOf(
        schema(
          complexType("TextDType", attribute({ ref: "xml:lang", use: "optional" })),
          element("text-holder", "TextDType"),
        ),
        "text-holder",
      );

      assert.deepStrictEqual(
        table,
        attributesOnly([
          { local: "lang", namespace: xmlNamespace, type: builtin("string"), use: "optional" },
        ]),
      );
    }),
  );

  it.effect("an xs:IDREF-derived attribute records as NCName, and xs:IDREFS as a list of it", () =>
    Effect.gen(function* idref() {
      const table = yield* tableOf(
        schema(
          xs(
            "simpleType",
            [attr("name", "UniqueIdentifierRefDType")],
            [xs("restriction", [attr("base", "xs:IDREF")])],
          ),
          complexType(
            "TextEntryDType",
            attribute({
              name: "response-identifier",
              type: "UniqueIdentifierRefDType",
              use: "required",
            }),
            attribute({ name: "refs", type: "xs:IDREFS" }),
          ),
          element("text-entry", "TextEntryDType"),
        ),
        "text-entry",
      );

      assert.deepStrictEqual(
        table,
        attributesOnly([
          {
            local: "refs",
            namespace: "",
            type: { item: builtin("NCName"), kind: "list" },
            use: "optional",
          },
          { local: "response-identifier", namespace: "", type: builtin("NCName"), use: "required" },
        ]),
      );
    }),
  );

  it.effect('xs:anyAttribute namespace="##any" processContents="lax" is recorded', () =>
    Effect.gen(function* anyAttribute() {
      const table = yield* tableOf(
        schema(
          xs(
            "attributeGroup",
            [attr("name", "extensionAnyTypeLax.Attr")],
            [xs("anyAttribute", [attr("namespace", "##any"), attr("processContents", "lax")])],
          ),
          complexType(
            "ParagraphDType",
            attribute({ name: "id", type: "xs:string" }),
            xs("attributeGroup", [attr("ref", "extensionAnyTypeLax.Attr")]),
          ),
          element("p", "ParagraphDType"),
        ),
        "p",
      );

      assert.deepStrictEqual(table, {
        anyAttribute: { namespace: "##any", process: "lax" },
        attributes: [{ local: "id", namespace: "", type: builtin("string"), use: "optional" }],
        children: [],
        text: false,
      });
    }),
  );

  it.effect("one element name declared with two types gets both types' attributes", () =>
    Effect.gen(function* twoTypes() {
      const table = yield* tableOf(
        schema(
          complexType("FirstDType", attribute({ name: "a", type: "xs:string", use: "required" })),
          complexType("SecondDType", attribute({ name: "b", type: "xs:boolean" })),
          complexType("HolderDType", xs("sequence", [], [element("body", "FirstDType")])),
          element("body", "SecondDType"),
        ),
        "body",
      );

      assert.deepStrictEqual(
        table,
        attributesOnly([
          { local: "a", namespace: "", type: builtin("string"), use: "optional" },
          { local: "b", namespace: "", type: builtin("boolean"), use: "optional" },
        ]),
      );
    }),
  );

  it.effect("elements come out sorted by name, attributes by namespace then local name", () =>
    Effect.gen(function* sorted() {
      const tables = yield* generateTables(
        schema(
          complexType(
            "UnsortedDType",
            attribute({ name: "zeta", type: "xs:string" }),
            attribute({ ref: "xml:base" }),
            attribute({ name: "alpha", type: "xs:string" }),
          ),
          element("zz", "UnsortedDType"),
          element("aa", "UnsortedDType"),
        ),
      );

      assert.deepStrictEqual(Object.keys(tables.elements), ["aa", "zz"]);
      assert.deepStrictEqual(
        tables.elements["aa"]?.attributes.map(({ local, namespace }) => [namespace, local]),
        [
          ["", "alpha"],
          ["", "zeta"],
          [xmlNamespace, "base"],
        ],
      );
    }),
  );
});

describe("patternEquivalents", () => {
  /**
   * Each distinct `xs:pattern` value of the QTI XSD, as the source view holds it, with one value
   * its equivalent accepts and one it refuses. The `ext:` pattern occurs twice in the XSD.
   */
  const samples: readonly (readonly [pattern: string, accepted: string, refused: string])[] = [
    [
      String.raw`(([0-9]+%?[,]){2}([0-9]+%?))|(([0-9]+%?[,]){3}([0-9]+%?))|(([0-9]+%?[,]){2}(([0-9]+%?[,]){2})+([0-9]+%?[,])([0-9]+%?))`,
      "0,0,10,0,10,10",
      "0,0",
    ],
    [String.raw`\{[\i-[:]][\c-[:]]*\}`, "{SCORE}", "{1st}"],
    ["[0-9]+%?", "50%", "50px"],
    [
      String.raw`[\p{IsBasicLatin}-[()<>@,;:\\"/\[\]?=]]+/[\p{IsBasicLatin}-[()<>@,;:\\"/\[\]?=]]+`,
      "text/html",
      "text html",
    ],
    [String.raw`(ext:)[a-zA-Z0-9_\.\-]+`, "ext:sign-language", "sign-language"],
    [String.raw`[\i-[:]][\c-[:]]*`, "RESPONSE", "a:b"],
  ];

  it("maps exactly the XSD's distinct patterns", () => {
    assert.deepStrictEqual(
      [...patternEquivalents.keys()].toSorted(),
      samples.map(([pattern]) => pattern).toSorted(),
    );
  });

  for (const [pattern, accepted, refused] of samples) {
    it(`${pattern} accepts ${accepted} and refuses ${refused}`, () => {
      const equivalent = patternEquivalents.get(pattern);
      assert.isDefined(equivalent);
      assert.isTrue(equivalent?.(accepted));
      assert.isFalse(equivalent?.(refused));
    });
  }
});

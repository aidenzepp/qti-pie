import { assert, describe, it } from "@effect/vitest";
import { Effect, Schema } from "effect";
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
  mathmlNamespace,
  qtiNamespace,
  xincludeNamespace,
  xmlNamespace,
  xmlnsNamespace,
  xsdNamespace,
} from "#plate/document/source.ts";
import type {
  AttributeTable,
  AttributeType,
  ChildName,
  ChildOccurrence,
  ContentTable,
  ElementTable,
} from "#plate/validate/xsd.ts";
import {
  generateOccurrences,
  generateTables,
  Occurrences,
  patternEquivalents,
  Tables,
} from "#plate/validate/xsd.ts";

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
 * Wrap definitions in an `xs:schema` whose target and default namespace is QTI's, whose local
 * elements are qualified, and which binds `xs`, `m3` and `xi`, as the QTI XSD's root does, with
 * further attributes on the root.
 *
 * @param attributes The root's further attributes, such as `blockDefault`.
 * @param definitions The schema's top-level definitions.
 * @returns The fragment as a source document.
 */
const schemaWith = (
  attributes: readonly SourceAttribute[],
  ...definitions: readonly SourceElement[]
): SourceDocument =>
  doc(
    "fragment.xsd",
    xs(
      "schema",
      [
        attr("xmlns", qtiNamespace, xmlnsNamespace),
        attr("xs", xsdNamespace, xmlnsNamespace),
        attr("m3", mathmlNamespace, xmlnsNamespace),
        attr("xi", xincludeNamespace, xmlnsNamespace),
        attr("targetNamespace", qtiNamespace),
        attr("elementFormDefault", "qualified"),
        ...attributes,
      ],
      definitions,
    ),
  );

/**
 * Wrap definitions in an `xs:schema` as {@link schemaWith} does, with no further root attributes.
 *
 * @param definitions The schema's top-level definitions.
 * @returns The fragment as a source document.
 */
const schema = (...definitions: readonly SourceElement[]): SourceDocument =>
  schemaWith([], ...definitions);

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
 * Construct a named `xs:simpleType` holding one derivation.
 *
 * @param name The type's name.
 * @param derivation Its `xs:restriction`, `xs:list` or `xs:union`.
 * @returns The simple type.
 */
const simpleType = (name: string, derivation: SourceElement): SourceElement =>
  xs("simpleType", [attr("name", name)], [derivation]);

/**
 * Construct an `xs:restriction` of a base, with no facets.
 *
 * @param base The base's QName, such as `xs:string`.
 * @returns The restriction.
 */
const restrictionOf = (base: string): SourceElement => xs("restriction", [attr("base", base)]);

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
 * Construct an `xs:element` reference to a global element.
 *
 * @param ref The element's QName, such as `img` or `m3:math`.
 * @returns The element reference.
 */
const elementRef = (ref: string): SourceElement => xs("element", [attr("ref", ref)]);

/**
 * Construct a model group, `xs:sequence`, `xs:choice` or `xs:all`, of the given particles.
 *
 * @param local The group's construct.
 * @param particles Its particles.
 * @returns The model group.
 */
const model = (
  local: "all" | "choice" | "sequence",
  ...particles: readonly SourceElement[]
): SourceElement => xs(local, [], particles);

/**
 * Construct an `xs:group` reference.
 *
 * @param ref The group's name.
 * @returns The group reference.
 */
const groupRef = (ref: string): SourceElement => xs("group", [attr("ref", ref)]);

/**
 * Name a child in the QTI namespace.
 *
 * @param local The child's local name.
 * @returns The child's name.
 */
const qti = (local: string): ChildName => ({ local, namespace: qtiNamespace });

/**
 * Name a type in the XML Schema namespace.
 *
 * @param local The type's local name, such as `string`.
 * @returns The type's name.
 */
const xsName = (local: string): ChildName => ({ local, namespace: xsdNamespace });

/**
 * The derivation part of a named type's entry, its table set aside: its base and derivation, or a
 * union's members.
 *
 * @param tables The generated tables.
 * @param name The type's local name.
 * @returns The derivation part; the test fails when the tables hold no such type.
 */
const derivationOf = (tables: Tables, name: string) => {
  const entry = tables.types[name];
  assert.isDefined(entry, `the tables hold the type ${name}`);

  return entry.derivation === "union"
    ? { derivation: entry.derivation, members: entry.members }
    : { base: entry.base, derivation: entry.derivation };
};

/**
 * The fields an element table and a type's entry share, every key present, so two tables compare
 * on exactly those.
 *
 * @param table An element table or a type's entry.
 * @returns Its wildcards, attributes, children and text.
 */
const contentOf = ({ anyAttribute, anyElement, attributes, children, text }: ContentTable) => ({
  anyAttribute,
  anyElement,
  attributes,
  children,
  text,
});

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
 * The table of a global element with only the given attributes and no content, as `p1-08a` leaves
 * it, declared with the given named types.
 *
 * @param attributes The element's attribute tables, sorted.
 * @param types The local names of its declared types in the QTI namespace, sorted.
 * @returns The element table.
 */
const attributesOnly = (
  attributes: ElementTable["attributes"],
  ...types: readonly string[]
): ElementTable => ({
  attributes,
  children: [],
  global: true,
  text: false,
  types: types.map(qti),
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
        attributesOnly(
          [
            { local: "id", namespace: "", type: builtin("string"), use: "required" },
            { local: "label", namespace: "", type: builtin("normalizedString"), use: "optional" },
          ],
          "DerivedDType",
        ),
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
        attributesOnly(
          [{ local: "id", namespace: "", type: builtin("string"), use: "optional" }],
          "NarrowDType",
        ),
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
        attributesOnly(
          [
            { local: "a", namespace: "", type: builtin("int"), use: "optional" },
            {
              default: "false",
              local: "b",
              namespace: "",
              type: builtin("boolean"),
              use: "optional",
            },
          ],
          "GroupedDType",
        ),
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
        attributesOnly(
          [{ local: "shape", namespace: "", type: areaKinds, use: "required" }],
          "AreaDType",
        ),
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
        attributesOnly(
          [
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
          ],
          "MixedDType",
        ),
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
        attributesOnly(
          [
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
          ],
          "HeadingDType",
        ),
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
        attributesOnly(
          [{ local: "lang", namespace: xmlNamespace, type: builtin("string"), use: "optional" }],
          "TextDType",
        ),
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
        attributesOnly(
          [
            {
              local: "refs",
              namespace: "",
              type: { item: builtin("NCName"), kind: "list" },
              use: "optional",
            },
            {
              local: "response-identifier",
              namespace: "",
              type: builtin("NCName"),
              use: "required",
            },
          ],
          "TextEntryDType",
        ),
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
        global: true,
        text: false,
        types: [qti("ParagraphDType")],
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
        attributesOnly(
          [
            { local: "a", namespace: "", type: builtin("string"), use: "optional" },
            { local: "b", namespace: "", type: builtin("boolean"), use: "optional" },
          ],
          "FirstDType",
          "SecondDType",
        ),
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
  it.effect("an extension inherits its base's children and adds its own", () =>
    Effect.gen(function* childExtension() {
      const table = yield* tableOf(
        schema(
          complexType("EmptyDType"),
          complexType(
            "BaseDType",
            model("sequence", elementRef("img"), element("caption", "EmptyDType")),
          ),
          complexType(
            "FigureDType",
            xs(
              "complexContent",
              [],
              [
                xs(
                  "extension",
                  [attr("base", "BaseDType")],
                  [model("sequence", element("note", "EmptyDType"))],
                ),
              ],
            ),
          ),
          element("img", "EmptyDType"),
          element("figure", "FigureDType"),
        ),
        "figure",
      );

      assert.deepStrictEqual(table.children, [qti("caption"), qti("img"), qti("note")]);
    }),
  );

  it.effect("a restriction's children are its own, not its base's", () =>
    Effect.gen(function* childRestriction() {
      const table = yield* tableOf(
        schema(
          complexType("EmptyDType"),
          complexType(
            "BaseDType",
            model("choice", element("p", "EmptyDType"), element("div", "EmptyDType")),
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
                  [model("choice", element("p", "EmptyDType"))],
                ),
              ],
            ),
          ),
          element("narrow", "NarrowDType"),
        ),
        "narrow",
      );

      assert.deepStrictEqual(table.children, [qti("p")]);
    }),
  );

  it.effect("a group reference expands, and sequence, choice and all flatten", () =>
    Effect.gen(function* flatten() {
      const table = yield* tableOf(
        schema(
          complexType("EmptyDType"),
          xs(
            "group",
            [attr("name", "inline.Group")],
            [model("choice", element("strong", "EmptyDType"), element("em", "EmptyDType"))],
          ),
          xs(
            "group",
            [attr("name", "meta.Group")],
            [model("all", element("footer", "EmptyDType"))],
          ),
          complexType(
            "BlockDType",
            model(
              "sequence",
              element("title", "EmptyDType"),
              model("choice", element("p", "EmptyDType"), groupRef("inline.Group")),
              groupRef("meta.Group"),
            ),
          ),
          element("block", "BlockDType"),
        ),
        "block",
      );

      assert.deepStrictEqual(table.children, [
        qti("em"),
        qti("footer"),
        qti("p"),
        qti("strong"),
        qti("title"),
      ]);
    }),
  );

  it.effect('xs:any namespace="##other" processContents="lax" is recorded', () =>
    Effect.gen(function* anyElement() {
      const table = yield* tableOf(
        schema(
          xs(
            "group",
            [attr("name", "grpLax.any")],
            [
              model(
                "sequence",
                xs("any", [
                  attr("namespace", "##other"),
                  attr("processContents", "lax"),
                  attr("minOccurs", "0"),
                  attr("maxOccurs", "unbounded"),
                ]),
              ),
            ],
          ),
          complexType("ExtensionDType", model("sequence", groupRef("grpLax.any"))),
          element("qti-custom", "ExtensionDType"),
        ),
        "qti-custom",
      );

      assert.deepStrictEqual(table, {
        anyElement: { namespace: "##other", process: "lax" },
        attributes: [],
        children: [],
        global: true,
        text: false,
        types: [qti("ExtensionDType")],
      });
    }),
  );

  it.effect('ref="m3:math" gives a MathML-namespace child, and MathML is never walked', () =>
    Effect.gen(function* mathRef() {
      const tables = yield* generateTables(
        schema(
          complexType("FlowDType", model("choice", elementRef("m3:math"))),
          element("div", "FlowDType"),
        ),
      );

      assert.deepStrictEqual(tables.elements["div"]?.children, [
        { local: "math", namespace: mathmlNamespace },
      ]);
      assert.deepStrictEqual(Object.keys(tables.elements), ["div"]);
    }),
  );

  it.effect("mixed and simpleContent give text, and an element-only type does not", () =>
    Effect.gen(function* text() {
      const tables = yield* generateTables(
        schema(
          complexType("EmptyDType"),
          xs(
            "complexType",
            [attr("name", "SpanDType"), attr("mixed", "true")],
            [model("sequence", element("b", "EmptyDType"))],
          ),
          complexType(
            "ValueDType",
            xs(
              "simpleContent",
              [],
              [
                xs(
                  "extension",
                  [attr("base", "xs:string")],
                  [attribute({ name: "base-type", type: "xs:string" })],
                ),
              ],
            ),
          ),
          complexType("ListDType", model("sequence", element("li", "EmptyDType"))),
          element("span", "SpanDType"),
          element("value", "ValueDType"),
          element("code", "xs:string"),
          element("ul", "ListDType"),
        ),
      );

      assert.deepStrictEqual(
        Object.fromEntries(
          ["span", "value", "code", "ul", "li"].map((name) => [name, tables.elements[name]?.text]),
        ),
        { code: true, li: false, span: true, ul: false, value: true },
      );
    }),
  );

  it.effect("the tables encode and decode through their Schema, children sorted", () =>
    Effect.gen(function* roundTrip() {
      const tables = yield* generateTables(
        schema(
          complexType("EmptyDType"),
          complexType(
            "MixDType",
            model(
              "choice",
              elementRef("xi:include"),
              element("zeta", "EmptyDType"),
              elementRef("m3:math"),
              element("alpha", "EmptyDType"),
            ),
          ),
          element("mix", "MixDType"),
        ),
      );

      const json = JSON.stringify(yield* Schema.encodeEffect(Tables)(tables));
      const decoded = yield* Schema.decodeUnknownEffect(Tables)(JSON.parse(json));
      assert.deepStrictEqual(decoded, tables);
      assert.deepStrictEqual(decoded.elements["mix"]?.children, [
        qti("alpha"),
        qti("zeta"),
        { local: "math", namespace: mathmlNamespace },
        { local: "include", namespace: xincludeNamespace },
      ]);
    }),
  );
});

describe("generateTables: declared types, global names and derivations", () => {
  it.effect(
    "a name declared globally with one type and locally with another records both types and is global",
    () =>
      Effect.gen(function* globalAndLocal() {
        const table = yield* tableOf(
          schema(
            complexType("FirstDType"),
            complexType("SecondDType"),
            complexType("HolderDType", model("sequence", element("body", "FirstDType"))),
            element("body", "SecondDType"),
          ),
          "body",
        );

        assert.isTrue(table.global);
        assert.deepStrictEqual(table.types, [qti("FirstDType"), qti("SecondDType")]);
        assert.notProperty(table, "anonymousType");
      }),
  );

  it.effect("a name declared only locally is not global", () =>
    Effect.gen(function* localOnly() {
      const tables = yield* generateTables(
        schema(
          complexType("PartDType"),
          complexType("HolderDType", model("sequence", element("part", "PartDType"))),
          element("holder", "HolderDType"),
        ),
      );

      assert.isFalse(tables.elements["part"]?.global);
      assert.deepStrictEqual(tables.elements["part"]?.types, [qti("PartDType")]);
      assert.isTrue(tables.elements["holder"]?.global);
    }),
  );

  it.effect("an extension and a restriction record their bases and derivations", () =>
    Effect.gen(function* derivations() {
      const tables = yield* generateTables(
        schema(
          complexType("BaseDType", attribute({ name: "id", type: "xs:string" })),
          complexType(
            "WiderDType",
            xs("complexContent", [], [xs("extension", [attr("base", "BaseDType")])]),
          ),
          complexType(
            "NarrowDType",
            xs("complexContent", [], [xs("restriction", [attr("base", "BaseDType")])]),
          ),
          complexType(
            "TextDType",
            xs("simpleContent", [], [xs("extension", [attr("base", "CodeDType")])]),
          ),
          simpleType("CodeDType", restrictionOf("xs:NCName")),
        ),
      );

      assert.deepStrictEqual(derivationOf(tables, "WiderDType"), {
        base: qti("BaseDType"),
        derivation: "extension",
      });
      assert.deepStrictEqual(derivationOf(tables, "NarrowDType"), {
        base: qti("BaseDType"),
        derivation: "restriction",
      });
      assert.deepStrictEqual(derivationOf(tables, "TextDType"), {
        base: qti("CodeDType"),
        derivation: "extension",
      });
      assert.deepStrictEqual(derivationOf(tables, "CodeDType"), {
        base: xsName("NCName"),
        derivation: "restriction",
      });
      assert.deepStrictEqual(Object.keys(tables.types), [
        "BaseDType",
        "CodeDType",
        "NarrowDType",
        "TextDType",
        "WiderDType",
      ]);
    }),
  );

  it.effect(
    "a complex type with neither complexContent nor simpleContent restricts xs:anyType",
    () =>
      Effect.gen(function* noDerivation() {
        const tables = yield* generateTables(
          schema(complexType("PlainDType", attribute({ name: "id", type: "xs:string" }))),
        );

        assert.deepStrictEqual(derivationOf(tables, "PlainDType"), {
          base: xsName("anyType"),
          derivation: "restriction",
        });
      }),
  );

  it.effect(
    "a union records its members, memberTypes then inline ones by their base, and no base",
    () =>
      Effect.gen(function* union() {
        const tables = yield* generateTables(
          schema(
            simpleType("CodeDType", restrictionOf("xs:NCName")),
            simpleType(
              "ToleranceDType",
              xs(
                "union",
                [attr("memberTypes", "xs:integer CodeDType")],
                [xs("simpleType", [], [restrictionOf("xs:double")])],
              ),
            ),
          ),
        );

        assert.deepStrictEqual(derivationOf(tables, "ToleranceDType"), {
          derivation: "union",
          members: [xsName("integer"), qti("CodeDType"), xsName("double")],
        });
      }),
  );

  it.effect(
    "an inline type records anonymousType and no name for it, and no type records xs:anyType",
    () =>
      Effect.gen(function* anonymous() {
        const tables = yield* generateTables(
          schema(
            complexType(
              "HolderDType",
              model(
                "sequence",
                xs(
                  "element",
                  [attr("name", "kind")],
                  [xs("simpleType", [], [restrictionOf("xs:string")])],
                ),
                xs("element", [attr("name", "box")], [xs("complexType")]),
                xs("element", [attr("name", "anything")]),
              ),
            ),
            element("holder", "HolderDType"),
          ),
        );

        assert.isTrue(tables.elements["kind"]?.anonymousType);
        assert.deepStrictEqual(tables.elements["kind"]?.types, []);
        assert.isTrue(tables.elements["box"]?.anonymousType);
        assert.deepStrictEqual(tables.elements["box"]?.types, []);
        assert.notProperty(tables.elements["anything"], "anonymousType");
        assert.deepStrictEqual(tables.elements["anything"]?.types, [xsName("anyType")]);
      }),
  );

  it.effect("a named list type fails with TableGenerationError naming xs:list", () =>
    Effect.gen(function* namedList() {
      const error = yield* generateTables(
        schema(simpleType("CodesDType", xs("list", [attr("itemType", "xs:NCName")]))),
      ).pipe(Effect.flip);

      assert.strictEqual(error._tag, "TableGenerationError");
      assert.strictEqual(error.construct, "xs:list");
    }),
  );

  it.effect(
    "nillable, abstract, block, final, blockDefault, finalDefault and substitutionGroup each fail, naming it",
    () =>
      Effect.gen(function* refused() {
        const empty = complexType("EmptyDType");
        const cases: readonly (readonly [string, SourceDocument])[] = [
          [
            "nillable",
            schema(
              empty,
              xs("element", [
                attr("name", "e"),
                attr("type", "EmptyDType"),
                attr("nillable", "true"),
              ]),
            ),
          ],
          [
            "abstract",
            schema(
              xs("complexType", [attr("name", "AbstractDType"), attr("abstract", "true")]),
              element("e", "AbstractDType"),
            ),
          ],
          [
            "block",
            schema(
              empty,
              xs("element", [attr("name", "e"), attr("type", "EmptyDType"), attr("block", "#all")]),
            ),
          ],
          [
            "final",
            schema(
              xs("complexType", [attr("name", "FinalDType"), attr("final", "extension")]),
              element("e", "FinalDType"),
            ),
          ],
          [
            "blockDefault",
            schemaWith([attr("blockDefault", "#all")], empty, element("e", "EmptyDType")),
          ],
          [
            "finalDefault",
            schemaWith([attr("finalDefault", "restriction")], empty, element("e", "EmptyDType")),
          ],
          [
            "substitutionGroup",
            schema(
              empty,
              element("head", "EmptyDType"),
              xs("element", [
                attr("name", "member"),
                attr("type", "EmptyDType"),
                attr("substitutionGroup", "head"),
              ]),
            ),
          ],
        ];

        for (const [construct, document] of cases) {
          const error = yield* generateTables(document).pipe(Effect.flip);

          assert.strictEqual(error._tag, "TableGenerationError", construct);
          assert.strictEqual(error.construct, construct);
        }
      }),
  );

  it.effect('abstract="false" and nillable="false" generate tables', () =>
    Effect.gen(function* notRefused() {
      const tables = yield* generateTables(
        schema(
          xs("complexType", [attr("name", "ConcreteDType"), attr("abstract", "false")]),
          xs("element", [
            attr("name", "e"),
            attr("type", "ConcreteDType"),
            attr("abstract", "false"),
            attr("nillable", "false"),
          ]),
        ),
      );

      assert.deepStrictEqual(tables.elements["e"]?.types, [qti("ConcreteDType")]);
    }),
  );
});

describe("generateTables: each named type's own table", () => {
  it.effect(
    "a type's entry holds its own table, and an extension's holds its base's attributes and its own",
    () =>
      Effect.gen(function* typeTables() {
        const lax = { namespace: "##other", process: "lax" } as const;
        const tables = yield* generateTables(
          schema(
            complexType("EmptyDType"),
            complexType(
              "BaseDType",
              model(
                "sequence",
                element("part", "EmptyDType"),
                xs("any", [attr("namespace", "##other"), attr("processContents", "lax")]),
              ),
              attribute({ name: "id", type: "xs:string", use: "required" }),
              xs("anyAttribute", [attr("namespace", "##other"), attr("processContents", "lax")]),
            ),
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
            simpleType("CodeDType", restrictionOf("xs:NCName")),
            simpleType("EitherDType", xs("union", [attr("memberTypes", "xs:integer CodeDType")])),
            element("derived", "DerivedDType"),
          ),
        );
        const id: AttributeTable = {
          local: "id",
          namespace: "",
          type: builtin("string"),
          use: "required",
        };
        const label: AttributeTable = {
          local: "label",
          namespace: "",
          type: builtin("normalizedString"),
          use: "optional",
        };

        assert.deepStrictEqual(tables.types["BaseDType"], {
          anyAttribute: lax,
          anyElement: lax,
          attributes: [id],
          base: xsName("anyType"),
          children: [qti("part")],
          derivation: "restriction",
          text: false,
        });
        assert.deepStrictEqual(tables.types["DerivedDType"], {
          anyAttribute: lax,
          anyElement: lax,
          attributes: [id, label],
          base: qti("BaseDType"),
          children: [qti("part")],
          derivation: "extension",
          text: false,
        });
        assert.deepStrictEqual(tables.types["EmptyDType"], {
          attributes: [],
          base: xsName("anyType"),
          children: [],
          derivation: "restriction",
          text: false,
        });
        assert.deepStrictEqual(tables.types["CodeDType"], {
          attributes: [],
          base: xsName("NCName"),
          children: [],
          derivation: "restriction",
          text: true,
        });
        assert.deepStrictEqual(tables.types["EitherDType"], {
          attributes: [],
          children: [],
          derivation: "union",
          members: [xsName("integer"), qti("CodeDType")],
          text: true,
        });

        const { derived } = tables.elements;
        const derivedType = tables.types["DerivedDType"];
        assert.isDefined(derived);
        assert.isDefined(derivedType);
        assert.deepStrictEqual(contentOf(derived), contentOf(derivedType));
      }),
  );

  it.effect("a type entry's table encodes and decodes through the Schema", () =>
    Effect.gen(function* typeRoundTrip() {
      const tables = yield* generateTables(
        schema(
          complexType("EmptyDType"),
          complexType(
            "HolderDType",
            model("sequence", element("part", "EmptyDType")),
            attribute({ name: "id", type: "xs:string" }),
          ),
        ),
      );

      const json = JSON.stringify(yield* Schema.encodeEffect(Tables)(tables));
      const decoded = yield* Schema.decodeUnknownEffect(Tables)(JSON.parse(json));
      assert.deepStrictEqual(decoded, tables);
      assert.deepStrictEqual(decoded.types["HolderDType"]?.children, [qti("part")]);
    }),
  );
});

/**
 * Construct a particle with its XSD attributes, given as name and value pairs, and its content.
 *
 * @param local The particle's construct, such as `element` or `sequence`.
 * @param pairs Its attributes, such as `{ maxOccurs: "unbounded", ref: "img" }`.
 * @param children Its particles.
 * @returns The particle.
 */
const particle = (
  local: "any" | "choice" | "element" | "group" | "sequence",
  pairs: Readonly<Record<string, string>>,
  ...children: readonly SourceElement[]
): SourceElement =>
  xs(
    local,
    Object.entries(pairs).map(([name, value]) => attr(name, value)),
    children,
  );

/**
 * The counts of a child in the QTI namespace.
 *
 * @param local The child's local name.
 * @param minOccurs The least number of times it is admitted.
 * @param maxOccurs The greatest number of times, or `unbounded`.
 * @returns The child's counts.
 */
const counted = (local: string, minOccurs: string, maxOccurs: string): ChildOccurrence => ({
  local,
  maxOccurs,
  minOccurs,
  namespace: qtiNamespace,
});

/**
 * Construct a named complex type that derives from a base by `extension` or `restriction`, with
 * its own content.
 *
 * @param name The type's name.
 * @param derivation How it derives.
 * @param base The base's name.
 * @param content Its own content model.
 * @returns The complex type.
 */
const derived = (
  name: string,
  derivation: "extension" | "restriction",
  base: string,
  content: SourceElement,
): SourceElement =>
  complexType(name, xs("complexContent", [], [xs(derivation, [attr("base", base)], [content])]));

/**
 * Schematron's namespace, in which the ASI XSD's annotations state its rules.
 */
const schematronNamespace = "http://purl.oclc.org/dsdl/schematron";

/**
 * Construct an element in Schematron's namespace, as the ASI XSD's `xs:appinfo` holds it.
 *
 * @param local The construct's local name, such as `pattern`.
 * @param attributes The construct's attributes, none by default.
 * @param children The construct's children, none by default.
 * @returns The Schematron element.
 */
const sch = (
  local: string,
  attributes: readonly SourceAttribute[] = [],
  children: readonly SourceChild[] = [],
): SourceElement => el(local, attributes, children, schematronNamespace);

/**
 * Construct a top-level `xs:annotation` whose `xs:appinfo` holds the given Schematron elements.
 *
 * @param rules The Schematron elements.
 * @returns The annotation.
 */
const appinfo = (...rules: readonly SourceElement[]): SourceElement =>
  xs("annotation", [], [xs("appinfo", [], rules)]);

/**
 * Construct a Schematron pattern with one rule per context, each asserting nothing that matters
 * here: the generator reads the contexts alone.
 *
 * @param id The pattern's `id`.
 * @param contexts Its rules' contexts, such as `//qti:box`.
 * @returns The pattern.
 */
const extensionPattern = (id: string, ...contexts: readonly string[]): SourceElement =>
  sch(
    "pattern",
    [attr("abstract", "false"), attr("id", id)],
    contexts.map((context) =>
      sch(
        "rule",
        [attr("abstract", "false"), attr("context", context)],
        [sch("assert", [attr("test", "starts-with(name(@*[1]), 'data-')")])],
      ),
    ),
  );

/**
 * The annotation that binds the Schematron prefix `qti` to QTI's namespace, as the ASI XSD's does.
 */
const qtiPrefix = appinfo(sch("ns", [attr("uri", qtiNamespace), attr("prefix", "qti")]));

/**
 * Wrap Schematron annotations in a schema that declares the elements `box`, `crate` and `plain`, of
 * one type with an `id`.
 *
 * @param annotations The annotations.
 * @returns The fragment as a source document.
 */
const boxesWith = (...annotations: readonly SourceElement[]): SourceDocument =>
  schema(
    ...annotations,
    complexType("BoxDType", attribute({ name: "id", type: "xs:NCName" })),
    element("box", "BoxDType"),
    element("crate", "BoxDType"),
    element("plain", "BoxDType"),
  );

describe("generateTables: the Schematron's extension lists (reading 90)", () => {
  it.effect(
    "align-54 extension lists E10: marks extensionCovered on each element a rule of the three extension patterns names, and on no other",
    () =>
      Effect.gen(function* covered() {
        const tables = yield* generateTables(
          boxesWith(
            qtiPrefix,
            appinfo(
              extensionPattern("RULESET_ROOTELEMENT_DATAEXTENSIONRULES", "//qti:box"),
              extensionPattern("RULESET_GLOBALELEMENT_DATAEXTENSIONRULES", "//qti:crate"),
              extensionPattern(
                "RULESET_LOCALELEMENT_DATAEXTENSIONRULES",
                "//qti:box",
                "//qti:crate",
              ),
              extensionPattern("RULE_SET_ARIA_ROLES_1", "//qti:plain"),
            ),
          ),
        );

        assert.isTrue(tables.elements["box"]?.extensionCovered);
        assert.isTrue(tables.elements["crate"]?.extensionCovered);
        assert.notProperty(tables.elements["plain"], "extensionCovered");
        assert.deepStrictEqual(Schema.encodeSync(Tables)(tables).elements["box"], {
          attributes: [{ local: "id", namespace: "", type: builtin("NCName"), use: "optional" }],
          children: [],
          extensionCovered: true,
          global: true,
          text: false,
          types: [qti("BoxDType")],
        });
      }),
  );

  it.effect("align-54 extension lists E10: a schema with no extension pattern covers nothing", () =>
    Effect.gen(function* uncovered() {
      const tables = yield* generateTables(boxesWith(qtiPrefix));

      for (const name of ["box", "crate", "plain"]) {
        assert.notProperty(tables.elements[name], "extensionCovered", name);
      }
    }),
  );

  it.effect(
    "align-54 extension lists E10: fails with TableGenerationError naming sch:rule for a context not of the form //prefix:name, a prefix no sch:ns binds to the target namespace, or an element the XSD does not declare",
    () =>
      Effect.gen(function* refused() {
        const mathPrefix = appinfo(sch("ns", [attr("uri", mathmlNamespace), attr("prefix", "m")]));
        for (const [annotations, context] of [
          [[qtiPrefix], "qti:box"],
          [[qtiPrefix], "//qti:box/qti:crate"],
          [[qtiPrefix], "//box"],
          [[qtiPrefix], "//qti:box[@id]"],
          [[qtiPrefix, mathPrefix], "//m:box"],
          [[], "//qti:box"],
          [[qtiPrefix], "//qti:missing"],
        ] as const) {
          const error = yield* generateTables(
            boxesWith(
              ...annotations,
              appinfo(extensionPattern("RULESET_GLOBALELEMENT_DATAEXTENSIONRULES", context)),
            ),
          ).pipe(Effect.flip);

          assert.strictEqual(error._tag, "TableGenerationError", context);
          assert.strictEqual(error.construct, "sch:rule", context);
        }
      }),
  );
});

describe("generateOccurrences", () => {
  it.effect("a sequence adds a child's counts, and a particle's occurs scale its content", () =>
    Effect.gen(function* sequenceCounts() {
      const occurrences = yield* generateOccurrences(
        schema(
          complexType("EmptyDType"),
          complexType(
            "ListDType",
            particle(
              "sequence",
              {},
              element("a", "EmptyDType"),
              particle("element", { minOccurs: "0", name: "a", type: "EmptyDType" }),
              particle("sequence", { maxOccurs: "3", minOccurs: "2" }, element("b", "EmptyDType")),
              particle("element", {
                maxOccurs: "unbounded",
                minOccurs: "0",
                name: "b",
                type: "EmptyDType",
              }),
            ),
          ),
          element("list", "ListDType"),
        ),
      );

      const expected = [counted("a", "1", "2"), counted("b", "2", "unbounded")];
      assert.deepStrictEqual(occurrences.elements["list"], expected);
      assert.deepStrictEqual(occurrences.types["ListDType"], expected);
    }),
  );

  it.effect(
    "a choice takes each child's least and greatest count over its branches, a branch without it counting none",
    () =>
      Effect.gen(function* choiceCounts() {
        const occurrences = yield* generateOccurrences(
          schema(
            complexType("EmptyDType"),
            complexType(
              "ChoiceDType",
              particle(
                "sequence",
                {},
                particle(
                  "choice",
                  { maxOccurs: "2" },
                  element("a", "EmptyDType"),
                  particle("sequence", {}, element("a", "EmptyDType"), element("b", "EmptyDType")),
                ),
                particle(
                  "sequence",
                  { maxOccurs: "unbounded" },
                  particle("element", {
                    maxOccurs: "0",
                    minOccurs: "0",
                    name: "c",
                    type: "EmptyDType",
                  }),
                ),
              ),
            ),
            complexType(
              "WildDType",
              particle(
                "choice",
                {},
                element("a", "EmptyDType"),
                particle("any", { namespace: "##other" }),
              ),
            ),
          ),
        );

        assert.deepStrictEqual(occurrences.types["ChoiceDType"], [
          counted("a", "1", "2"),
          counted("b", "0", "2"),
          counted("c", "0", "0"),
        ]);
        assert.deepStrictEqual(occurrences.types["WildDType"], [counted("a", "0", "1")]);
      }),
  );

  it.effect(
    "a group reference and an extension add their counts, and a restriction's are its own",
    () =>
      Effect.gen(function* derivedCounts() {
        const occurrences = yield* generateOccurrences(
          schema(
            complexType("EmptyDType"),
            xs(
              "group",
              [attr("name", "meta.Group")],
              [particle("sequence", {}, element("footer", "EmptyDType"))],
            ),
            complexType(
              "BaseDType",
              particle(
                "sequence",
                {},
                element("title", "EmptyDType"),
                particle("group", { minOccurs: "0", ref: "meta.Group" }),
              ),
            ),
            derived(
              "LongDType",
              "extension",
              "BaseDType",
              particle(
                "sequence",
                {},
                particle("element", { minOccurs: "0", name: "title", type: "EmptyDType" }),
              ),
            ),
            derived(
              "ShortDType",
              "restriction",
              "BaseDType",
              particle("sequence", {}, element("title", "EmptyDType")),
            ),
          ),
        );

        assert.deepStrictEqual(occurrences.types["BaseDType"], [
          counted("footer", "0", "1"),
          counted("title", "1", "1"),
        ]);
        assert.deepStrictEqual(occurrences.types["LongDType"], [
          counted("footer", "0", "1"),
          counted("title", "1", "2"),
        ]);
        assert.deepStrictEqual(occurrences.types["ShortDType"], [counted("title", "1", "1")]);
      }),
  );

  it.effect(
    "one name declared with two types takes each child's least and greatest count over them",
    () =>
      Effect.gen(function* declarationCounts() {
        const occurrences = yield* generateOccurrences(
          schema(
            complexType("EmptyDType"),
            complexType("HeadDType", particle("sequence", {}, element("version", "EmptyDType"))),
            complexType(
              "NoteDType",
              particle(
                "sequence",
                {},
                particle("element", {
                  maxOccurs: "unbounded",
                  name: "line",
                  type: "EmptyDType",
                }),
              ),
            ),
            complexType(
              "ManifestDType",
              particle("sequence", {}, element("metadata", "HeadDType")),
            ),
            complexType(
              "ResourceDType",
              particle(
                "sequence",
                {},
                particle("element", {
                  minOccurs: "0",
                  name: "metadata",
                  type: "NoteDType",
                }),
              ),
            ),
            element("manifest", "ManifestDType"),
            element("resource", "ResourceDType"),
          ),
        );

        assert.deepStrictEqual(occurrences.elements["manifest"], [counted("metadata", "1", "1")]);
        assert.deepStrictEqual(occurrences.elements["resource"], [counted("metadata", "0", "1")]);
        assert.deepStrictEqual(occurrences.elements["metadata"], [
          counted("line", "0", "unbounded"),
          counted("version", "0", "1"),
        ]);
        assert.deepStrictEqual(occurrences.types["HeadDType"], [counted("version", "1", "1")]);
      }),
  );

  it.effect(
    "every element table and type entry has its occurrences, which encode and decode through the Schema",
    () =>
      Effect.gen(function* occurrenceKeys() {
        const fragment = schema(
          complexType("EmptyDType"),
          simpleType("CodeDType", restrictionOf("xs:string")),
          complexType("HolderDType", particle("sequence", {}, element("part", "EmptyDType"))),
          element("holder", "HolderDType"),
          element("code", "CodeDType"),
        );
        const tables = yield* generateTables(fragment);
        const occurrences = yield* generateOccurrences(fragment);

        assert.deepStrictEqual(Object.keys(occurrences.elements), Object.keys(tables.elements));
        assert.deepStrictEqual(Object.keys(occurrences.types), Object.keys(tables.types));
        assert.deepStrictEqual(occurrences.types["CodeDType"], []);

        const json = JSON.stringify(yield* Schema.encodeEffect(Occurrences)(occurrences));
        assert.deepStrictEqual(
          yield* Schema.decodeUnknownEffect(Occurrences)(JSON.parse(json)),
          occurrences,
        );
      }),
  );

  it.effect("a count that is not a non-negative integer fails with TableGenerationError", () =>
    Effect.gen(function* badCount() {
      const error = yield* generateOccurrences(
        schema(
          complexType("EmptyDType"),
          complexType(
            "BadDType",
            particle(
              "sequence",
              {},
              particle("element", {
                minOccurs: "-1",
                name: "a",
                type: "EmptyDType",
              }),
            ),
          ),
        ),
      ).pipe(Effect.flip);

      assert.strictEqual(error._tag, "TableGenerationError");
      assert.strictEqual(error.construct, "xs:element");
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

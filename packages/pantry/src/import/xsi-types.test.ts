/**
 * The local-type validator of `xsi-types.ts`. Each case reads an element from an inline literal
 * with `readXml` and judges it against a type of the tables of `seed/xsi.ts`. A type of XML
 * Schema's own is named, since the Recommendation names it; a type of a schema document is found by
 * property from the tables, so a table that moves a name moves no case.
 */
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { addedAttributes, covers, validLocal, validValue } from "#pantry/import/xsi-types.ts";
import type { SchemaSetHandle } from "#pantry/schema/content/rosters.ts";
import type { SchemaVersionHandle } from "#pantry/schema/kinds/generic.ts";
import type { TypeKey } from "#pantry/schema/seed/xsi.ts";
import {
  attributeUse,
  declaredChild,
  declaredRoot,
  globalAttributeType,
  simpleFacet,
  typeAttributeWildcard,
  typeDerivation,
  typeNamespaces,
} from "#pantry/schema/seed/xsi.ts";
import { readXml } from "@qti-pie/crust/read.ts";

const xsiNamespace = "http://www.w3.org/2001/XMLSchema-instance";

const noIds: ReadonlySet<string> = new Set<string>();

/**
 * Where the types of XML Schema's own, and of the asi set, are judged unless a case says otherwise.
 */
const asiSet: SchemaSetHandle = "asi";

const asiVersion: SchemaVersionHandle = "3.0.1";

/**
 * `validLocal` in a schema set and version, the asi set 3.0.1 unless given.
 */
const validIn = (
  element: Parameters<typeof validLocal>[0],
  type: TypeKey,
  declared: TypeKey | undefined,
  ids: ReadonlySet<string>,
  set: SchemaSetHandle = asiSet,
  version: SchemaVersionHandle = asiVersion,
) => validLocal(element, type, declared, set, version, ids);

/**
 * The key of a type, to compare and collect types.
 */
const keyOf = (type: TypeKey): string =>
  "anonymous" in type ? `!${type.anonymous}` : `{${type.namespace}}${type.local}`;

/**
 * A type of XML Schema's own.
 */
const xs = (local: string): TypeKey => ({ local, namespace: typeNamespaces.xs });

/**
 * The root element of `xml`.
 */
const elementOf = (xml: string) =>
  readXml(new TextEncoder().encode(xml)).pipe(Effect.map((document) => document.root));

/**
 * Whether the element `<e>text</e>` is valid against `type`, with `ids` the document's ID values.
 */
const textValid = (
  type: TypeKey,
  text: string,
  ids: ReadonlySet<string> = noIds,
  set: SchemaSetHandle = asiSet,
  version: SchemaVersionHandle = asiVersion,
) =>
  elementOf(`<e>${text}</e>`).pipe(
    Effect.map((element) => Option.isNone(validIn(element, type, undefined, ids, set, version))),
  );

/**
 * Every type name the derivation reaches from `start`, itself first.
 */
const lineage = (start: TypeKey): readonly TypeKey[] => {
  const found: TypeKey[] = [start];

  for (const current of found) {
    for (const row of typeDerivation) {
      if (keyOf(row.type) === keyOf(current) && !found.some((t) => keyOf(t) === keyOf(row.base))) {
        found.push(row.base);
      }
    }
  }

  return found;
};

/**
 * The types a declaration declares, in the four schema sets.
 */
const declaredTypes: ReadonlyMap<string, TypeKey> = new Map(
  [...declaredRoot, ...declaredChild].map((row) => [keyOf(row.type), row.type]),
);

/**
 * Every simple type that derives from a declared type, found from `typeDerivation`.
 */
const derivedSimple: readonly TypeKey[] = [
  ...new Map(
    typeDerivation
      .filter((row) => row.variety === "simple")
      .filter((row) =>
        lineage(row.type)
          .slice(1)
          .some((ancestor) => declaredTypes.has(keyOf(ancestor))),
      )
      .map((row) => [keyOf(row.type), row.type] as const),
  ).values(),
];

/**
 * Every complex type that derives from a declared type, found from `typeDerivation`.
 */
const derivedComplex: readonly TypeKey[] = [
  ...new Map(
    typeDerivation
      .filter((row) => row.variety === "complex")
      .filter((row) =>
        lineage(row.type)
          .slice(1)
          .some((ancestor) => declaredTypes.has(keyOf(ancestor))),
      )
      .map((row) => [keyOf(row.type), row.type] as const),
  ).values(),
];

/**
 * The type of the asi schema named `local`.
 */
const asi = (local: string): TypeKey => {
  const found = derivedSimple.find((type) => "local" in type && type.local === local);

  if (found === undefined) {
    throw new Error(`no derived simple type is named ${local}`);
  }

  return found;
};

/**
 * The simple type of the tables named `local`, in the namespace of whichever set holds it first.
 */
const named = (local: string, namespace?: string) => {
  const row = typeDerivation.find(
    (candidate) =>
      candidate.variety === "simple" &&
      "local" in candidate.type &&
      candidate.type.local === local &&
      (namespace === undefined || candidate.type.namespace.endsWith(namespace)),
  );

  assert.isDefined(row, `no simple type ${local}`);

  return row ?? typeDerivation[0] ?? assert.fail("no type");
};

describe("covers", () => {
  it("holds for every simple type derived from a declared type", () => {
    assert.isAbove(derivedSimple.length, 40);

    for (const type of derivedSimple) {
      assert.isTrue(covers(type), keyOf(type));
    }
  });

  it("holds for the simple types a later schema reads as declared", () => {
    for (const local of ["anySimpleType", "string", "normalizedString", "integer"]) {
      assert.isTrue(covers(xs(local)), local);
    }
  });

  it("does not hold for a complex type or a type it cannot judge", () => {
    assert.isFalse(covers(xs("anyType")));
    assert.isFalse(covers(xs("noSuchDatatype")));
  });
});

/**
 * An unqualified attribute use a derived complex type requires in every schema set and version
 * that holds it.
 */
const requiredEverywhere = () =>
  attributeUse.find(
    (row) =>
      row.required &&
      row.namespace === "" &&
      derivedComplex.some((type) => keyOf(type) === keyOf(row.type)) &&
      attributeUse.every(
        (other) =>
          keyOf(other.type) !== keyOf(row.type) ||
          other.namespace !== row.namespace ||
          other.local !== row.local ||
          other.required,
      ),
  );

describe("a complex type derived from a declared type", () => {
  it("has no declared child, so the kind's own content check stands for it", () => {
    const parents = new Set(declaredChild.map((row) => keyOf(row.parent)));
    const emptyDeclared = [...declaredTypes.values()].filter(
      (type) =>
        !parents.has(keyOf(type)) &&
        typeDerivation.some((row) => keyOf(row.type) === keyOf(type) && row.variety === "complex"),
    );

    assert.isAbove(emptyDeclared.length, 0);

    for (const declared of emptyDeclared) {
      for (const type of derivedComplex) {
        if (lineage(type).some((ancestor) => keyOf(ancestor) === keyOf(declared))) {
          assert.isFalse(parents.has(keyOf(type)), `${keyOf(type)} under ${keyOf(declared)}`);
        }
      }
    }
  });

  it.effect("refuses the bare element when a required attribute use is missing", () =>
    Effect.gen(function* requiredUse() {
      const use = requiredEverywhere();

      assert.isDefined(use);

      const type = use?.type ?? xs("anyType");
      const bare = yield* elementOf("<e/>");
      const names = new Set(
        attributeUse
          .filter((row) => row.required && keyOf(row.type) === keyOf(type) && row.namespace === "")
          .map((row) => row.local),
      );
      const given = yield* elementOf(`<e ${[...names].map((name) => `${name}="x"`).join(" ")}/>`);

      assert.isTrue(Option.isSome(validIn(bare, type, undefined, noIds, use?.set, use?.version)));
      assert.isTrue(Option.isNone(validIn(given, type, undefined, noIds, use?.set, use?.version)));
    }),
  );

  it.effect("ignores a required use the declared type itself holds", () =>
    Effect.gen(function* declaredUse() {
      const use = requiredEverywhere();
      const bare = yield* elementOf("<e/>");

      assert.isDefined(use);
      assert.isTrue(
        Option.isNone(
          validIn(bare, use?.type ?? xs("anyType"), use?.type, noIds, use?.set, use?.version),
        ),
      );
    }),
  );
});

describe("validLocal on xs:anyType", () => {
  it.effect("is valid with any attributes and content", () =>
    Effect.gen(function* anyType() {
      const element = yield* elementOf('<e a="1"><c/>text</e>');

      assert.isTrue(Option.isNone(validIn(element, xs("anyType"), undefined, noIds)));
    }),
  );
});

describe("validLocal on a simple type", () => {
  it.effect("refuses an element child", () =>
    Effect.gen(function* elementChild() {
      const element = yield* elementOf("<e><c/></e>");

      assert.isTrue(Option.isSome(validIn(element, xs("string"), undefined, noIds)));
    }),
  );

  it.effect("refuses an attribute that is not one of the four xsi names", () =>
    Effect.gen(function* foreignAttribute() {
      const element = yield* elementOf("<e a='1'>x</e>");
      const namespaced = yield* elementOf(`<e xmlns:xsi="${xsiNamespace}" xsi:foo="1">x</e>`);

      assert.isTrue(Option.isSome(validIn(element, xs("string"), undefined, noIds)));
      assert.isTrue(Option.isSome(validIn(namespaced, xs("string"), undefined, noIds)));
    }),
  );

  it.effect("accepts xsi:type, the three other xsi names and a namespace declaration", () =>
    Effect.gen(function* xsiAttributes() {
      const element = yield* elementOf(
        `<e xmlns:xsi="${xsiNamespace}" xmlns:ex="urn:ex" xsi:type="ex:t" xsi:nil="false" xsi:schemaLocation="urn:ex x.xsd" xsi:noNamespaceSchemaLocation="y.xsd">x</e>`,
      );

      assert.isTrue(Option.isNone(validIn(element, xs("string"), undefined, noIds)));
    }),
  );

  it.effect("accepts any text for the types with no lexical bound", () =>
    Effect.gen(function* anyText() {
      for (const local of ["anySimpleType", "string", "normalizedString", "token"]) {
        assert.isTrue(yield* textValid(xs(local), "  any text, 1 &amp; more "), local);
      }
    }),
  );

  it.effect("reads the text trimmed and normalized by the type's whiteSpace", () =>
    Effect.gen(function* whiteSpace() {
      assert.isTrue(yield* textValid(xs("byte"), "\n 127 \t"));
      assert.isTrue(yield* textValid(xs("NMTOKEN"), " a\n"));
      assert.isFalse(yield* textValid(xs("NMTOKEN"), "a b"));
    }),
  );
});

describe("the integer family", () => {
  const bounds = [
    ["integer", "-123456789012345678901234567890", "1.5"],
    ["nonPositiveInteger", "0", "1"],
    ["negativeInteger", "-1", "0"],
    ["long", "9223372036854775807", "9223372036854775808"],
    ["int", "-2147483648", "-2147483649"],
    ["short", "32767", "32768"],
    ["byte", "127", "128"],
    ["nonNegativeInteger", "0", "-1"],
    ["unsignedLong", "18446744073709551615", "18446744073709551616"],
    ["unsignedInt", "4294967295", "4294967296"],
    ["unsignedShort", "65535", "65536"],
    ["unsignedByte", "255", "256"],
    ["positiveInteger", "1", "0"],
  ] as const;

  for (const [local, inside, outside] of bounds) {
    it.effect(`xs:${local}: ${inside} in, ${outside} out`, () =>
      Effect.gen(function* range() {
        assert.isTrue(yield* textValid(xs(local), inside));
        assert.isFalse(yield* textValid(xs(local), outside));
      }),
    );
  }

  it.effect("accepts a plus sign and refuses an empty value or a letter", () =>
    Effect.gen(function* lexical() {
      assert.isTrue(yield* textValid(xs("integer"), "+5"));
      assert.isFalse(yield* textValid(xs("integer"), ""));
      assert.isFalse(yield* textValid(xs("integer"), "1e3"));
    }),
  );

  it.effect("ARIALevelIntegerDType: 1 in, 0 out", () =>
    Effect.gen(function* ariaLevel() {
      assert.isTrue(yield* textValid(asi("ARIALevelIntegerDType"), "1"));
      assert.isFalse(yield* textValid(asi("ARIALevelIntegerDType"), "0"));
    }),
  );
});

describe("the name types", () => {
  it.effect("xs:NCName takes 300 characters but no colon", () =>
    Effect.gen(function* ncName() {
      assert.isTrue(yield* textValid(xs("NCName"), "a".repeat(300)));
      assert.isFalse(yield* textValid(xs("NCName"), "a:b"));
      assert.isFalse(yield* textValid(xs("NCName"), "1a"));
    }),
  );

  it.effect("xs:Name takes a colon", () =>
    Effect.gen(function* name() {
      assert.isTrue(yield* textValid(xs("Name"), "a:b"));
      assert.isTrue(yield* textValid(xs("Name"), ":a"));
      assert.isFalse(yield* textValid(xs("Name"), "-a"));
    }),
  );

  it.effect("xs:NMTOKEN takes a leading digit and a leading hyphen", () =>
    Effect.gen(function* nmtoken() {
      assert.isTrue(yield* textValid(xs("NMTOKEN"), "-1"));
      assert.isFalse(yield* textValid(xs("NMTOKEN"), ""));
    }),
  );

  it.effect("xs:language takes any subtag length and refuses an underscore", () =>
    Effect.gen(function* language() {
      assert.isTrue(yield* textValid(xs("language"), "en-GB"));
      assert.isTrue(yield* textValid(xs("language"), `en-${"x".repeat(8)}-${"y".repeat(8)}`));
      assert.isFalse(yield* textValid(xs("language"), "en_GB"));
      assert.isFalse(yield* textValid(xs("language"), "toolongsub"));
    }),
  );

  it.effect("xs:ID is an NCName not among the ids, xs:IDREF one among them", () =>
    Effect.gen(function* identifiers() {
      const ids = new Set(["a"]);

      assert.isFalse(yield* textValid(xs("ID"), "a", ids));
      assert.isTrue(yield* textValid(xs("ID"), "b", ids));
      assert.isFalse(yield* textValid(xs("ID"), "1b", ids));
      assert.isTrue(yield* textValid(xs("IDREF"), "a", ids));
      assert.isFalse(yield* textValid(xs("IDREF"), "b", ids));
      assert.isFalse(yield* textValid(xs("IDREF"), "a", noIds));
    }),
  );

  it.effect("xs:ENTITY takes an NCName and does not look for its declaration (L-2)", () =>
    Effect.gen(function* entity() {
      assert.isTrue(yield* textValid(xs("ENTITY"), "abc"));
      assert.isFalse(yield* textValid(xs("ENTITY"), "a b"));
    }),
  );
});

describe("the facets of a derived type", () => {
  it.effect("a pattern type has a value in and a value out", () =>
    Effect.gen(function* patterns() {
      const cases = [
        ["CoordsDType", "10,20,30", "10,20"],
        ["MimeTypeDType", "image/png", "image"],
        ["SupportExtStringDType", "ext:a.b-c_1", "a.b"],
        ["UseExtensionStringDType", "ext:x", "ext:"],
      ] as const;

      for (const [local, inside, outside] of cases) {
        assert.isTrue(yield* textValid(asi(local), inside), `${local} ${inside}`);
        assert.isFalse(yield* textValid(asi(local), outside), `${local} ${outside}`);
      }
    }),
  );

  it.effect("MimeTypeListDType judges as MimeTypeDType", () =>
    Effect.gen(function* mimeTypeList() {
      for (const text of ["image/png", "image", "text/plain;x", "a/b/c", ""]) {
        assert.strictEqual(
          yield* textValid(asi("MimeTypeListDType"), text),
          yield* textValid(asi("MimeTypeDType"), text),
          text,
        );
      }
    }),
  );

  it.effect("an enumerated type takes its listed values only", () =>
    Effect.gen(function* enumeration() {
      const facet = simpleFacet.find(
        (row) =>
          row.facet === "enumeration" &&
          derivedSimple.some((type) => keyOf(type) === keyOf(row.type)),
      );
      const type = facet?.type ?? xs("string");
      const listed = simpleFacet.filter(
        (row) => row.facet === "enumeration" && keyOf(row.type) === keyOf(type),
      );

      assert.isDefined(facet);

      for (const row of listed) {
        assert.isTrue(yield* textValid(type, row.value, noIds, row.set, row.version), row.value);
      }

      assert.isFalse(
        yield* textValid(type, "not-a-listed-value", noIds, facet?.set, facet?.version),
      );
    }),
  );

  it.effect("a minLength of 1 refuses the empty value", () =>
    Effect.gen(function* minLength() {
      const facet = simpleFacet.find(
        (row) =>
          row.facet === "minLength" &&
          row.value === "1" &&
          derivedSimple.some((type) => keyOf(type) === keyOf(row.type)),
      );

      assert.isDefined(facet);

      const type = facet?.type ?? xs("string");

      assert.isFalse(yield* textValid(type, "", noIds, facet?.set, facet?.version));
      assert.isTrue(yield* textValid(type, "a", noIds, facet?.set, facet?.version));
    }),
  );
});

/**
 * Whether `value` is in the value space of `type` in a schema set and version.
 */
const valueOk = (
  value: string,
  type: TypeKey,
  ids: ReadonlySet<string> = noIds,
  set: SchemaSetHandle = asiSet,
  version: SchemaVersionHandle = asiVersion,
) => Option.isNone(validValue(value, type, set, version, ids));

/**
 * The first attribute use named `local` (and, when given, held by the type named `owner`), whose
 * type is looked up in its own schema set and version.
 */
const useOf = (local: string, owner?: string) => {
  const found = attributeUse.find(
    (row) =>
      row.namespace === "" &&
      row.local === local &&
      (owner === undefined || ("local" in row.type && row.type.local === owner)),
  );

  assert.isDefined(found, `no attribute use ${local}`);

  return found ?? attributeUse[0] ?? assert.fail("no attribute use");
};

/**
 * Whether a value is in the value space of the type of an attribute use.
 */
const useOk = (local: string, value: string, owner?: string, ids: ReadonlySet<string> = noIds) => {
  const use = useOf(local, owner);

  return valueOk(value, use.attributeType, ids, use.set, use.version);
};

/**
 * Whether each value of `inside` is in the value space of the built-in `local`, and each of
 * `outside` is not.
 */
const lexicalCases = (
  local: string,
  inside: readonly string[],
  outside: readonly string[],
): void => {
  for (const value of inside) {
    assert.isTrue(valueOk(value, xs(local)), `xs:${local} takes "${value}"`);
  }

  for (const value of outside) {
    assert.isFalse(valueOk(value, xs(local)), `xs:${local} refuses "${value}"`);
  }
};

describe("the invariant of covers", () => {
  /**
   * Every complex type derived, through complex derivations, from a type an element is declared
   * with.
   */
  const reached = new Set(derivedComplex.map((type) => keyOf(type)));

  it("holds for every attribute type of every derived complex type's attribute uses", () => {
    const uses = attributeUse.filter((row) => reached.has(keyOf(row.type)));

    assert.isAbove(uses.length, 100);

    for (const use of uses) {
      assert.isTrue(covers(use.attributeType), `${keyOf(use.type)} ${use.local}`);
    }
  });

  it("holds for every global attribute of the asi set", () => {
    const globals = globalAttributeType.filter((row) => row.set === "asi");

    assert.isAbove(globals.length, 0);

    for (const global of globals) {
      assert.isTrue(covers(global.type), `${global.namespace} ${global.local}`);
    }
  });

  it("holds for every simple type of the tables, patterns included", () => {
    const simple = typeDerivation.filter((row) => row.variety === "simple");

    assert.isAbove(simple.length, 1000);

    for (const row of simple) {
      assert.isTrue(covers(row.type), keyOf(row.type));
    }

    assert.isAbove(simpleFacet.filter((row) => row.facet === "pattern").length, 40);
  });
});

describe("validValue on the primitive datatypes", () => {
  it("judges xs:boolean, xs:decimal, xs:float and xs:double", () => {
    lexicalCases("boolean", ["true", "false", "1", "0", " 1 "], ["yes", "TRUE", "", "2"]);
    lexicalCases("decimal", ["1", "-1.5", ".5", "+3.", "007"], ["1e3", "", ".", "1,5", "INF"]);
    lexicalCases(
      "float",
      ["1e3", "-INF", "INF", "NaN", "1.5E-3", "-.5"],
      ["+INF", "inf", "1e", ""],
    );
    lexicalCases("double", ["INF", "12", "0.5e+2"], ["1e", "1.2.3"]);
  });

  it("judges xs:duration", () => {
    lexicalCases(
      "duration",
      ["P1Y", "P1Y2M3DT4H5M6S", "PT0S", "-P1D", "PT1.5S", "P1M", "PT1M"],
      ["P", "PT", "P1YT", "1Y", "P-1Y", "P1D2M", "P1.5Y", "PT.5S", "PT1.S"],
    );
  });

  it("judges xs:dateTime, its year, its day and its end of day", () => {
    lexicalCases(
      "dateTime",
      [
        "2002-10-05T10:00:00",
        "2002-10-05T10:00:00.5Z",
        "2002-10-05T24:00:00",
        "-0001-01-01T00:00:00+14:00",
        "20020-10-05T10:00:00",
        "2000-02-29T00:00:00",
      ],
      [
        "2002-10-05T24:00:01",
        "2002-02-30T00:00:00",
        "2001-02-29T00:00:00",
        "2002-10-05",
        "0000-01-01T00:00:00",
        "02002-10-05T10:00:00",
        "2002-10-05T10:00:00+14:01",
        "2002-13-05T10:00:00",
        "2002-10-05T10:60:00",
        "2002-10-05T10:00",
        "+2002-10-05T10:00:00",
      ],
    );
  });

  it("judges xs:date, xs:time and the Gregorian types", () => {
    lexicalCases(
      "date",
      ["2004-02-29", "2002-10-10+13:00", "2002-10-10Z"],
      ["2001-02-29", "2002-4-1", "2002-10-10T00:00:00"],
    );
    lexicalCases(
      "time",
      ["13:20:00-05:00", "24:00:00", "00:00:00.000"],
      ["23:59:60", "24:00:01", "1:20:00", "13:20"],
    );
    lexicalCases(
      "gYearMonth",
      ["1999-05", "-0044-03", "1999-05Z"],
      ["1999-13", "1999-5", "1999-00"],
    );
    lexicalCases("gYear", ["1999", "-0044", "12345", "1999+01:00"], ["999", "01999", "0000"]);
    lexicalCases(
      "gMonthDay",
      ["--05-31", "--02-29", "--12-31Z"],
      ["--02-30", "--04-31", "--13-01", "05-31"],
    );
    lexicalCases("gDay", ["---15", "---31", "---01Z"], ["---32", "---00", "--15", "---5"]);
    lexicalCases("gMonth", ["--11", "--01Z"], ["--13", "--11--", "--00", "11"]);
  });

  it("judges xs:hexBinary and xs:base64Binary", () => {
    lexicalCases("hexBinary", ["0FB7", "0fb7", ""], ["0FB", "GG", "0F B7"]);
    lexicalCases(
      "base64Binary",
      ["", "YQ==", "YWI=", "YWJj", "YW Jj", "YWJj YQ=="],
      ["YR==", "YQ=", "Y", "YQ=a", "Y!Jj"],
    );
  });

  it("judges xs:anyURI, xs:QName and xs:NOTATION", () => {
    lexicalCases("anyURI", ["http://example.com/a?b#c", "a/b", ""], ["%zz"]);
    lexicalCases("QName", ["a", "p:a", "p-1:a.b"], [":a", "a:b:c", "1a", "a:", "a b"]);
    lexicalCases("NOTATION", ["jpeg", "p:gif"], ["a:b:c", ""]);
  });

  it("judges the examples of the brief", () => {
    lexicalCases("boolean", ["1"], ["yes"]);
    lexicalCases("double", ["INF"], ["1e"]);
  });

  it("accepts a value of a type that is not a simple type of the tables, unchecked", () => {
    assert.isTrue(valueOk("anything", xs("anyType")));
    assert.isTrue(valueOk("anything", { local: "NoSuchDType", namespace: "urn:none" }));
  });
});

describe("validValue on derived types", () => {
  const nonNegativeDouble = typeDerivation.find(
    (row) =>
      row.method === "restriction" &&
      "local" in row.base &&
      row.base.local === "double" &&
      simpleFacet.some(
        (facet) =>
          keyOf(facet.type) === keyOf(row.type) &&
          facet.facet === "minInclusive" &&
          Number(facet.value) === 0,
      ),
  );

  it("a bound facet of xs:double holds INF and refuses a negative number and NaN", () => {
    assert.isDefined(nonNegativeDouble);

    const type = nonNegativeDouble?.type ?? xs("double");

    assert.isTrue(valueOk("0", type));
    assert.isTrue(valueOk("INF", type));
    assert.isFalse(valueOk("-1", type));
    assert.isFalse(valueOk("NaN", type));
    assert.isFalse(valueOk("-INF", type));
  });

  it("an enumerated use takes a listed value only (aria-live)", () => {
    const use = useOf("aria-live");
    const listed = simpleFacet.filter(
      (row) => row.facet === "enumeration" && keyOf(row.type) === keyOf(use.attributeType),
    );

    assert.isAbove(listed.length, 1);

    for (const row of listed) {
      assert.isTrue(useOk("aria-live", row.value), row.value);
    }

    assert.isFalse(useOk("aria-live", "not-a-listed-value"));
  });

  it("a list takes items valid for its item type (match-group)", () => {
    assert.isTrue(useOk("match-group", "a b"));
    assert.isTrue(useOk("match-group", "  a   b\n"));
    assert.isFalse(useOk("match-group", "a 1"));
  });

  it("a union takes a value valid for one member (RandomIntegerDType min)", () => {
    assert.isTrue(useOk("min", "3", "RandomIntegerDType"));
    assert.isTrue(useOk("min", "v1", "RandomIntegerDType"));
    assert.isFalse(useOk("min", "1.5", "RandomIntegerDType"));
  });

  it("xml:lang takes a language tag and the empty string", () => {
    const lang = globalAttributeType.find(
      (row) => row.set === "asi" && row.local === "lang" && row.version === asiVersion,
    );

    assert.isDefined(lang);

    const type = lang?.type ?? xs("language");

    assert.isTrue(valueOk("en-GB", type));
    assert.isTrue(valueOk("", type));
    assert.isFalse(valueOk("en_GB", type));
  });

  it("LengthDType takes a number and an optional percent sign", () => {
    assert.isTrue(valueOk("10%", named("LengthDType").type));
    assert.isTrue(valueOk("10", named("LengthDType").type));
    assert.isFalse(valueOk("10px", named("LengthDType").type));
  });

  it("VariableStringDType takes an NCName, and its braced form a braced NCName", () => {
    assert.isTrue(valueOk("v1", named("VariableStringDType").type));
    assert.isFalse(valueOk("1v", named("VariableStringDType").type));
    assert.isFalse(valueOk("a:b", named("VariableStringDType").type));
    assert.isTrue(valueOk("{v1}", named("EncVariableStringDType").type));
    assert.isFalse(valueOk("{1v}", named("EncVariableStringDType").type));
    assert.isFalse(valueOk("v1", named("EncVariableStringDType").type));
  });

  it("an IDREF use judges against the ids, and xs:IDREFS needs an item", () => {
    const ids = new Set(["a"]);

    assert.isTrue(useOk("aria-activedescendant", "a", undefined, ids));
    assert.isFalse(useOk("aria-activedescendant", "b", undefined, ids));
    assert.isFalse(useOk("aria-activedescendant", "a", undefined, noIds));
    assert.isTrue(valueOk("a a", xs("IDREFS"), ids));
    assert.isFalse(valueOk("a b", xs("IDREFS"), ids));
    assert.isFalse(valueOk("", xs("IDREFS"), ids));
    assert.isFalse(valueOk("  ", xs("NMTOKENS")));
    assert.isTrue(valueOk(" a  1 ", xs("NMTOKENS")));
  });

  it("xs:ID is an NCName here, and its uniqueness is the ID pass's", () => {
    assert.isTrue(valueOk("a", xs("ID"), new Set(["a"])));
    assert.isFalse(valueOk("1a", xs("ID")));
  });

  it("a decimal facet counts digits, and an integer enumeration compares by value", () => {
    const ariaLevel = asi("ARIALevelIntegerDType");

    assert.isTrue(valueOk("+01", ariaLevel));
    assert.isFalse(valueOk("0", ariaLevel));
  });

  it("every pattern of the tables compiles and judges its own type", () => {
    const patterns = simpleFacet.filter((row) => row.facet === "pattern");

    assert.isAbove(patterns.length, 40);

    for (const row of patterns) {
      assert.isTrue(covers(row.type), `${keyOf(row.type)} ${row.value}`);
    }
  });

  it("the tables' own patterns take a value in and refuse one out", () => {
    const cases = [
      ["color", "MathML", "#fa0", "#fa"],
      ["db.datatype", "synthesis", "+3.5dB", "3.5"],
      ["duration", "synthesis", "250ms", "250"],
      ["ExtensionString.Type", "imsafa3p0drd_v1p0", "ext:a b|c", "ext:"],
      ["DateDType", "imsqti_usagedata_v3p0", "2002-10-05", "2002-1-5"],
    ] as const;

    for (const [local, namespace, inside, outside] of cases) {
      const row = named(local, namespace);

      assert.isTrue(valueOk(inside, row.type, noIds, row.set, row.version), `${local} ${inside}`);
      assert.isFalse(
        valueOk(outside, row.type, noIds, row.set, row.version),
        `${local} ${outside}`,
      );
    }
  });
});

/**
 * The type an element is declared with: `qti-null`'s, found from the declaration rows.
 */
const nullDeclared = (): TypeKey => {
  const row = [...declaredRoot, ...declaredChild].find(
    (candidate) => candidate.local === "qti-null",
  );

  assert.isDefined(row);

  return row?.type ?? xs("anyType");
};

/**
 * Values to try for an attribute: one of them is valid for most types.
 */
const candidates = ["a", "1", "en", "a b", "1 2", "true"] as const;

/**
 * A value that is valid for the type, one of the candidates, or `undefined`.
 */
const validFor = (type: TypeKey, set: SchemaSetHandle, version: SchemaVersionHandle) =>
  candidates.find((value) => valueOk(value, type, noIds, set, version));

/**
 * The rows of a block that belong to a type.
 */
const ofType = <
  A extends { readonly set: string; readonly type: TypeKey; readonly version: string },
>(
  rows: readonly A[],
  found: { readonly set: string; readonly type: TypeKey; readonly version: string },
) =>
  rows.filter(
    (row) =>
      row.set === found.set &&
      row.version === found.version &&
      keyOf(row.type) === keyOf(found.type),
  );

/**
 * A complex type derived from `qti-null`'s declared type, found by property in a block: with a
 * wildcard of `##any` and `lax` and a use of the given name, or with no wildcard and exactly two
 * required uses whose values `validFor` fills.
 */
const derivedFrom = (
  property:
    | { readonly use: { readonly local: string; readonly namespace: string } }
    | { readonly required: 2 },
) => {
  const declared = nullDeclared();
  const found = derivedComplex
    .filter((type) => lineage(type).some((ancestor) => keyOf(ancestor) === keyOf(declared)))
    .flatMap((type) =>
      typeDerivation
        .filter((row) => keyOf(row.type) === keyOf(type))
        .map((row) => ({ set: row.set, type, version: row.version })),
    )
    .find((candidate) => {
      const uses = ofType(attributeUse, candidate);
      const [wildcard] = ofType(typeAttributeWildcard, candidate);

      if ("use" in property) {
        return (
          wildcard?.process === "lax" &&
          uses.every((use) => !use.required) &&
          wildcard.namespaces === "##any" &&
          uses.some(
            (use) => use.local === property.use.local && use.namespace === property.use.namespace,
          )
        );
      }

      const required = uses.filter((use) => use.required);

      return (
        wildcard === undefined &&
        required.length === property.required &&
        required.every(
          (use) => validFor(use.attributeType, candidate.set, candidate.version) !== undefined,
        )
      );
    });

  assert.isDefined(found);

  return found ?? { set: asiSet, type: xs("anyType"), version: asiVersion };
};

const xmlNamespace = "http://www.w3.org/XML/1998/namespace";

/**
 * The two required uses of a block's type, with a valid value for each.
 */
const requiredUses = (found: {
  readonly set: SchemaSetHandle;
  readonly type: TypeKey;
  readonly version: SchemaVersionHandle;
}) =>
  ofType(attributeUse, found)
    .filter((use) => use.required)
    .map((use) => ({
      local: use.local,
      type: use.attributeType,
      value: validFor(use.attributeType, found.set, found.version) ?? "a",
    }));

describe("addedAttributes", () => {
  it.effect(
    "names the uses of a type with no wildcard, and leaves out an attribute neither admits",
    () =>
      Effect.gen(function* uses() {
        const found = derivedFrom({ required: 2 });
        const required = requiredUses(found);
        const element = yield* elementOf(
          `<e ${required.map((use) => `${use.local}="${use.value}"`).join(" ")} foo="x"/>`,
        );
        const added = addedAttributes(
          element,
          found.type,
          nullDeclared(),
          found.set,
          found.version,
        );

        assert.deepStrictEqual(
          added.map((attribute) => [attribute.local, attribute.by.kind]),
          required.map((use) => [use.local, "use"]),
        );
        assert.deepStrictEqual(
          added.map((attribute) => attribute.value),
          required.map((use) => use.value),
        );
        assert.isTrue(
          added.every((attribute) => attribute.prefix === "" && attribute.namespace === ""),
        );
      }),
  );

  it.effect(
    "names a use, then a wildcard's attributes of every namespace but xmlns and the four xsi names",
    () =>
      Effect.gen(function* wildcard() {
        const found = derivedFrom({ use: { local: "lang", namespace: xmlNamespace } });
        const element = yield* elementOf(
          `<e xmlns:ma="urn:ma" xmlns:xsi="${xsiNamespace}" xml:lang="en" data-foo="1" ma:x="2" xsi:foo="3" xsi:nil="false" xsi:type="x"/>`,
        );
        const added = addedAttributes(
          element,
          found.type,
          nullDeclared(),
          found.set,
          found.version,
        );

        assert.deepStrictEqual(
          added.map((attribute) => [attribute.local, attribute.by.kind]),
          [
            ["lang", "use"],
            ["data-foo", "wildcard"],
            ["x", "wildcard"],
            ["foo", "wildcard"],
          ],
        );
        assert.deepStrictEqual(
          added.map((attribute) => attribute.prefix),
          ["xml", "", "ma", "xsi"],
        );
        assert.isTrue(
          added.every((attribute) => attribute.by.kind === "use" || attribute.by.process === "lax"),
        );
      }),
  );

  it.effect("holds nothing for an attribute the declared type holds", () =>
    Effect.gen(function* declaredUses() {
      const found = derivedFrom({ required: 2 });
      const element = yield* elementOf(
        `<e ${requiredUses(found)
          .map((use) => `${use.local}="${use.value}"`)
          .join(" ")}/>`,
      );

      assert.deepStrictEqual(
        addedAttributes(element, found.type, found.type, found.set, found.version),
        [],
      );
    }),
  );
});

describe("validLocal on the attributes a derived type adds", () => {
  it.effect("judges each added use's value against its type", () =>
    Effect.gen(function* uses() {
      const found = derivedFrom({ required: 2 });
      const required = requiredUses(found);
      const written = (values: readonly string[]) =>
        required.map((use, position) => `${use.local}="${values[position] ?? ""}"`).join(" ");
      const good = yield* elementOf(`<e ${written(required.map((use) => use.value))}/>`);
      const bad = required.findIndex(
        (use) => !valueOk("x y z", use.type, noIds, found.set, found.version),
      );

      assert.isTrue(
        Option.isNone(validIn(good, found.type, nullDeclared(), noIds, found.set, found.version)),
      );
      assert.isAtLeast(bad, 0);

      const broken = yield* elementOf(
        `<e ${written(required.map((use, position) => (position === bad ? "x y z" : use.value)))}/>`,
      );

      assert.isTrue(
        Option.isSome(validIn(broken, found.type, nullDeclared(), noIds, found.set, found.version)),
      );
    }),
  );

  it.effect("judges a wildcard's attribute against the set's global declaration", () =>
    Effect.gen(function* wildcard() {
      const found = derivedFrom({ use: { local: "lang", namespace: xmlNamespace } });
      const judge = (attributes: string) =>
        elementOf(`<e xmlns:ma="urn:ma" ${attributes}/>`).pipe(
          Effect.map((element) =>
            validIn(element, found.type, nullDeclared(), noIds, found.set, found.version),
          ),
        );

      assert.isTrue(Option.isNone(yield* judge('xml:lang="en-GB"')));
      assert.isTrue(Option.isSome(yield* judge('xml:lang="en_GB"')));
      assert.isTrue(Option.isNone(yield* judge('xml:space="preserve"')));
      assert.isTrue(Option.isSome(yield* judge('xml:space="bogus"')));
      assert.isTrue(Option.isNone(yield* judge('ma:x="anything"')));
      assert.isTrue(Option.isNone(yield* judge('data-foo="anything"')));
      assert.isTrue(Option.isNone(yield* judge('xml:lang=""')));
    }),
  );

  it.effect("still requires the uses the type requires", () =>
    Effect.gen(function* required() {
      const found = derivedFrom({ required: 2 });
      const bare = yield* elementOf("<e/>");

      assert.isTrue(
        Option.isSome(validIn(bare, found.type, nullDeclared(), noIds, found.set, found.version)),
      );
    }),
  );
});

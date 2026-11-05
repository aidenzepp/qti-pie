/**
 * The local-type validator of `xsi-types.ts`. Each case reads an element from an inline literal
 * with `readXml` and judges it against a type of the tables of `seed/xsi.ts`. A type of XML
 * Schema's own is named, since the Recommendation names it; a type of a schema document is found by
 * property from the tables, so a table that moves a name moves no case.
 */
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { covers, validLocal } from "#pantry/import/xsi-types.ts";
import type { TypeKey } from "#pantry/schema/seed/xsi.ts";
import {
  attributeUse,
  declaredChild,
  declaredRoot,
  simpleFacet,
  typeDerivation,
  typeNamespaces,
} from "#pantry/schema/seed/xsi.ts";
import { readXml } from "@qti-pie/crust/read.ts";

const xsiNamespace = "http://www.w3.org/2001/XMLSchema-instance";

const noIds: ReadonlySet<string> = new Set<string>();

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
const textValid = (type: TypeKey, text: string, ids: ReadonlySet<string> = noIds) =>
  elementOf(`<e>${text}</e>`).pipe(
    Effect.map((element) => Option.isNone(validLocal(element, type, undefined, ids))),
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
    assert.isFalse(covers(xs("duration")));
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

      assert.isTrue(Option.isSome(validLocal(bare, type, undefined, noIds)));
      assert.isTrue(Option.isNone(validLocal(given, type, undefined, noIds)));
    }),
  );

  it.effect("ignores a required use the declared type itself holds", () =>
    Effect.gen(function* declaredUse() {
      const use = requiredEverywhere();
      const bare = yield* elementOf("<e/>");

      assert.isDefined(use);
      assert.isTrue(Option.isNone(validLocal(bare, use?.type ?? xs("anyType"), use?.type, noIds)));
    }),
  );
});

describe("validLocal on xs:anyType", () => {
  it.effect("is valid with any attributes and content", () =>
    Effect.gen(function* anyType() {
      const element = yield* elementOf('<e a="1"><c/>text</e>');

      assert.isTrue(Option.isNone(validLocal(element, xs("anyType"), undefined, noIds)));
    }),
  );
});

describe("validLocal on a simple type", () => {
  it.effect("refuses an element child", () =>
    Effect.gen(function* elementChild() {
      const element = yield* elementOf("<e><c/></e>");

      assert.isTrue(Option.isSome(validLocal(element, xs("string"), undefined, noIds)));
    }),
  );

  it.effect("refuses an attribute that is not one of the four xsi names", () =>
    Effect.gen(function* foreignAttribute() {
      const element = yield* elementOf("<e a='1'>x</e>");
      const namespaced = yield* elementOf(`<e xmlns:xsi="${xsiNamespace}" xsi:foo="1">x</e>`);

      assert.isTrue(Option.isSome(validLocal(element, xs("string"), undefined, noIds)));
      assert.isTrue(Option.isSome(validLocal(namespaced, xs("string"), undefined, noIds)));
    }),
  );

  it.effect("accepts xsi:type, the three other xsi names and a namespace declaration", () =>
    Effect.gen(function* xsiAttributes() {
      const element = yield* elementOf(
        `<e xmlns:xsi="${xsiNamespace}" xmlns:ex="urn:ex" xsi:type="ex:t" xsi:nil="false" xsi:schemaLocation="urn:ex x.xsd" xsi:noNamespaceSchemaLocation="y.xsd">x</e>`,
      );

      assert.isTrue(Option.isNone(validLocal(element, xs("string"), undefined, noIds)));
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
        assert.isTrue(yield* textValid(type, row.value), row.value);
      }

      assert.isFalse(yield* textValid(type, "not-a-listed-value"));
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
      assert.isFalse(yield* textValid(facet?.type ?? xs("string"), ""));
      assert.isTrue(yield* textValid(facet?.type ?? xs("string"), "a"));
    }),
  );
});

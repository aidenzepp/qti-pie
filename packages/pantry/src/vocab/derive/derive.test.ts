import { createHash } from "node:crypto";
import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, describe, it, layer } from "@effect/vitest";
import { ConfigProvider, Context, Effect, FileSystem, Layer, Match, Option, Result } from "effect";
import { Digest } from "effect/crypto";
import { readXml } from "@qti-pie/crust/read.ts";
import type { Element, XmlDocument } from "@qti-pie/crust/tree.ts";
import { int8Max } from "#pantry/grammar/closed.ts";
import type { ArityRow } from "#pantry/grammar/expression.ts";
import { asi as asiFacet } from "#pantry/grammar/facets.ts";
import {
  arityOf,
  attributeOf,
  contentOf,
  elementsOf,
  entriesOf,
  entryOf,
  includesOf,
  indexSchema,
  indexSchemas,
  isXs,
  leaves,
  mathmlSource,
  resolve,
} from "#pantry/vocab/derive/derive.ts";
import type { AttributeRow, Content, Entry, XsdSchema } from "#pantry/vocab/derive/derive.ts";
import {
  checkCache,
  readSource,
  sourcePaths,
  sources,
  verifySource,
  XsdSourceMismatch,
  XsdSourceMissing,
} from "#pantry/vocab/derive/sources.ts";
import type { SourcePath } from "#pantry/vocab/derive/sources.ts";
import type { InlineType, TypeReading, WhiteSpace } from "#pantry/vocab/inventory/types.ts";

/**
 * The package folder, `packages/pantry`.
 */
const packageRoot = path.resolve(import.meta.dirname, "../../..");

/**
 * A `HOME` under the package's ignored `work/` that nothing creates, so its XSD cache is absent.
 */
const absentHome = `${packageRoot}/work/vocab-derive-test-no-home`;

/**
 * Why the cache-gated suite cannot run here: the cache's missing files, or `None` when every
 * pinned XSD is present. Any other failure of the check fails the file's load.
 */
const absence = await Effect.runPromise(
  checkCache().pipe(
    Effect.as(Option.none<XsdSourceMissing>()),
    Effect.catchTag("XsdSourceMissing", (missing) => Effect.succeed(Option.some(missing))),
    Effect.provide(NodeServices.layer),
  ),
);

/**
 * The timeout, in milliseconds, for the hook that reads and indexes the pinned XSDs.
 *
 * The two ASI XSDs are 18 MB each and take most of it. Measured on 2026-11-05 on a 10-CPU M2 Max
 * at load averages of 10 to 12, with other suites running: five builds took 2.7 to 3.0 s. Measured
 * again on 2026-11-07 on a 14-core M4 Pro at a load average of 81: the build took about 42 s, past
 * the old 20 s budget, so the hook timed out and vitest skipped all five tests that read the
 * pinned XSDs. The budget is twice the larger measurement. Raise it only on a new measurement
 * recorded here, never to make a run pass.
 */
const schemasHookTimeoutMs = 84_000;

/**
 * The pinned XSDs as read once for the suite: every document, the two ASI schemas indexed, and the
 * MathML schema read through its includes.
 */
class Schemas extends Context.Service<
  Schemas,
  {
    readonly asi300: XsdSchema;
    readonly asi301: XsdSchema;
    readonly documents: ReadonlyMap<SourcePath, XmlDocument>;
  }
>()("vocab/derive.test/Schemas") {}

/**
 * Read every pinned XSD through its digest check, and index the two ASI schemas.
 */
const SchemasLayer = Layer.effect(
  Schemas,
  Effect.gen(function* readSchemas() {
    const read = yield* Effect.forEach(
      sourcePaths,
      (name) => readSource(name).pipe(Effect.map((document) => [name, document] as const)),
      { concurrency: "unbounded" },
    );
    const documents = new Map(read);
    const indexed = (name: SourcePath) =>
      Effect.fromOption(Option.fromNullishOr(documents.get(name))).pipe(
        Effect.flatMap((document) => Effect.fromResult(indexSchema(document))),
      );

    return Schemas.of({
      asi300: yield* indexed("imsqti_asiv3p0_v1p0.xsd"),
      asi301: yield* indexed("imsqti_asiv3p0p1_v1p0.xsd"),
      documents,
    });
  }),
);

/**
 * Unwrap a derivation's result, failing the test with the reading error.
 *
 * @param result - The derivation's result.
 * @returns Its value.
 */
const valueOf = <A, E>(result: Result.Result<A, E>): A =>
  Result.getOrElse(result, (failure) => assert.fail(String(failure)));

/**
 * The key of an arity row as a keyed set holds it: its kind and both bounds.
 *
 * @param row - The row.
 * @returns The key.
 */
const arityKey = ({ kind, max, min }: ArityRow): string => `${kind} ${min} ${max}`;

/**
 * One element of a schema whose declared type references a name: the element and that type.
 */
interface Host {
  readonly element: string;
  readonly type: string;
}

/**
 * The elements whose declared type's content references an element name: each pair of an element
 * and a named complex type of the schema it is declared with, read through the deriver's content
 * reading and keyed by the pair.
 *
 * @param schema - The schema the elements are declared in.
 * @param name - The referenced name as the schema writes it, such as `m3:math`.
 * @returns The hosts, keyed `element type`.
 */
const hostsOf = (schema: XsdSchema, name: string): ReadonlyMap<string, Host> =>
  new Map(
    [...schema.declarations].flatMap(([element, types]) =>
      types.flatMap((type) => {
        const resolved = valueOf(resolve(schema, type));
        const complexType =
          resolved.namespace === schema.targetNamespace
            ? Option.fromNullishOr(schema.complexTypes.get(resolved.local))
            : Option.none<Element>();

        return Option.toArray(complexType).flatMap((held) =>
          valueOf(contentOf(schema, held)).references.some((reference) => reference.name === name)
            ? [[`${element} ${type}`, { element, type }] as const]
            : [],
        );
      }),
    ),
  );

/**
 * Read an inline XML document, as crust reads a pinned XSD.
 *
 * @param text - The document's text.
 * @returns Its tree.
 */
const parse = (text: string) => readXml(new TextEncoder().encode(text));

/**
 * The `xs:schema` start tag of an inline schema in the namespace `urn:t`, bound to `t`.
 *
 * @param target - The target namespace, `urn:t` unless a test needs another.
 * @returns The start tag, with `elementFormDefault="qualified"`.
 */
const schemaTag = (target = "urn:t"): string =>
  `<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:t="${target}" targetNamespace="${target}" elementFormDefault="qualified">`;

/**
 * The failure detail of a derivation that must fail.
 *
 * @param result - The derivation's result.
 * @returns The reading error's message.
 */
const failureOf = <A, E>(result: Result.Result<A, E>): string =>
  Result.match(result, {
    onFailure: String,
    onSuccess: () => assert.fail("the derivation succeeded"),
  });

/**
 * Read the content of one named complex type of an inline schema.
 *
 * @param schema - The schema.
 * @param type - The type's name.
 * @returns The reading.
 */
const contentOfType = (schema: XsdSchema, type: string) =>
  Option.match(Option.fromNullishOr(schema.complexTypes.get(type)), {
    onNone: () => assert.fail(`no complex type ${type}`),
    onSome: (complexType) => valueOf(contentOf(schema, complexType)),
  });

/**
 * The entry of a kind among derived entries, failing the test when they hold none.
 *
 * @param entries - The entries.
 * @param handle - The kind.
 * @returns Its entry.
 */
const entryNamed = (entries: readonly Entry[], handle: string): Entry =>
  Option.getOrElse(Option.fromNullishOr(entries.find((entry) => entry.handle === handle)), () =>
    assert.fail(`no entry ${handle}`),
  );

/**
 * Read an inline schema that includes one location, as `mathml/mathml3.xsd` would.
 *
 * @param location - The `schemaLocation` of its one `xs:include`.
 * @returns Its tree.
 */
const including = (location: string) =>
  parse(`${schemaTag()}<xs:include schemaLocation="${location}"/></xs:schema>`);

describe("vocab/derive/sources.ts", () => {
  it.effect("refuses bytes that do not hash to the pin, naming both digests and the URL", () =>
    Effect.gen(function* mismatch() {
      const bytes = new TextEncoder().encode(
        '<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema"/>',
      );
      const failure = yield* Effect.flip(verifySource("w3/xml.xsd", bytes));

      assert.instanceOf(failure, XsdSourceMismatch);
      assert.strictEqual(failure.expected, sources["w3/xml.xsd"].sha256);
      assert.strictEqual(failure.actual, createHash("sha256").update(bytes).digest("hex"));
      assert.include(failure.message, sources["w3/xml.xsd"].url);
    }).pipe(Effect.provide(Digest.layerWebCrypto)),
  );

  it.effect("names every pinned file and its URL when the cache directory is absent", () =>
    Effect.gen(function* absent() {
      const fs = yield* FileSystem.FileSystem;

      assert.isFalse(yield* fs.exists(absentHome));

      const failure = yield* Effect.flip(checkCache());

      assert.instanceOf(failure, XsdSourceMissing);
      assert.deepStrictEqual(
        failure instanceof XsdSourceMissing ? failure.missing : [],
        sourcePaths.map((name) => ({ path: name, url: sources[name].url })),
      );
      // Every pin is missing, so the count the message states is the pinned set's size, twice.
      assert.include(
        failure.message,
        `${String(sourcePaths.length)} of the ${String(sourcePaths.length)} pinned XSDs are not in ${absentHome}/.cache`,
      );
    }).pipe(
      Effect.provide(
        Layer.mergeAll(
          NodeServices.layer,
          ConfigProvider.layer(ConfigProvider.fromUnknown({ HOME: absentHome })),
        ),
      ),
    ),
  );
});

/**
 * Read the entry of one complex type of an inline schema in the namespace `urn:t`, as a kind of
 * the type's name.
 *
 * @param schema - The schema, which binds `t` to its target namespace.
 * @param type - The type's local name.
 * @returns The entry.
 */
const entryOfType = (schema: XsdSchema, type: string): Entry =>
  valueOf(entryOf(schema, { element: type, handle: type, type: `t:${type}` }));

/**
 * The attribute row of one name in an entry, failing the test when the entry has none.
 *
 * @param entry - The entry.
 * @param name - The attribute's name.
 * @returns The row.
 */
const rowOf = (entry: Entry, name: string): AttributeRow =>
  Option.getOrElse(Option.fromNullishOr(entry.attributes.find((row) => row.name === name)), () =>
    assert.fail(`${entry.handle} has no attribute ${name}`),
  );

/**
 * The enumeration values a type reading states, in document order: a restriction's base's, then
 * its own; a list's item type's; each union member's in turn; none for a named type.
 *
 * @param type - The type reading.
 * @returns The values.
 */
const enumerationsOf = (type: TypeReading): readonly string[] =>
  Match.valueTags(type, {
    list: ({ item }) => enumerationsOf(item),
    named: () => [],
    restriction: ({ base, facets }) => [
      ...enumerationsOf(base),
      ...facets.flatMap(({ facet, value }) => (facet === "enumeration" ? [value] : [])),
    ],
    union: ({ members }) => members.flatMap(enumerationsOf),
  });

/**
 * A reference to a named type, as the deriver reads one.
 *
 * @param name - The type's QName.
 * @returns The reference.
 */
const named = (name: string): TypeReading => ({ _tag: "named", name });

/**
 * The content class of text of a named type.
 *
 * @param type - The type's designator.
 * @param whiteSpace - Its class.
 * @returns The `text` class.
 */
const textOf = (type: string, whiteSpace: WhiteSpace): Content => ({
  _tag: "text",
  inline: Option.none(),
  type,
  whiteSpace,
});

/**
 * An anonymous restriction of a named type by enumeration, as the deriver reads one.
 *
 * @param base - The restricted type's QName.
 * @param values - The enumeration values.
 * @returns The definition.
 */
const enumeration = (base: string, values: readonly string[]): InlineType => ({
  _tag: "restriction",
  base: named(base),
  facets: values.map((value) => ({ facet: "enumeration", value })),
});

/**
 * Every element under a schema element, at any depth.
 *
 * @param node - The element to search.
 * @returns The elements, in document order.
 */
const under = (node: Element): readonly Element[] =>
  elementsOf(node).flatMap((child) => [child, ...under(child)]);

/**
 * What one XSD's attribute declarations say about their types, by attribute name: for each
 * declaration that names its attribute, the `xs:enumeration` values under it in document order
 * when its type is anonymous, `None` when it names a type.
 *
 * @param root - The `xs:schema` element.
 * @returns The declarations by name, in document order.
 */
const declaredTypesOf = (
  root: Element,
): ReadonlyMap<string, readonly Option.Option<string[]>[]> => {
  const found = new Map<string, Option.Option<string[]>[]>();

  for (const declaration of under(root).filter((node) => isXs(node, "attribute"))) {
    const name = attributeOf(declaration, "name");

    if (Option.isSome(name)) {
      const anonymous = elementsOf(declaration).some((child) => isXs(child, "simpleType"));
      const values = under(declaration)
        .filter((node) => isXs(node, "enumeration"))
        .flatMap((node) => Option.toArray(attributeOf(node, "value")));

      found.set(name.value, [
        ...(found.get(name.value) ?? []),
        anonymous ? Option.some(values) : Option.none(),
      ]);
    }
  }

  return found;
};

/**
 * Check entries' attribute types against the declarations of the XSD they were read from.
 *
 * A row of a name the XSD declares only with anonymous types keeps an anonymous definition, a row
 * of a name it declares only with named types keeps none, and every definition kept states the
 * enumeration values of one of the name's anonymous declarations.
 *
 * @param entries - The entries.
 * @param roots - The `xs:schema` elements of the documents the entries were read from.
 * @returns How many rows kept an anonymous definition.
 */
const checkInlineTypes = (entries: readonly Entry[], roots: readonly Element[]): number => {
  const declared = new Map<string, readonly Option.Option<string[]>[]>();

  for (const root of roots) {
    for (const [name, types] of declaredTypesOf(root)) {
      declared.set(name, [...(declared.get(name) ?? []), ...types]);
    }
  }

  let kept = 0;

  for (const entry of entries) {
    for (const row of entry.attributes) {
      const types = declared.get(row.name) ?? [];
      const where = `${entry.handle} ${row.name}`;

      if (types.length > 0 && types.every(Option.isSome)) {
        assert.isTrue(Option.isSome(row.inline), `${where} keeps its anonymous type`);
      }

      if (types.every(Option.isNone)) {
        assert.isTrue(Option.isNone(row.inline), `${where} has a named type`);
      }

      if (Option.isSome(row.inline)) {
        const values = enumerationsOf(row.inline.value);

        kept += 1;
        assert.isTrue(
          types.some((type) =>
            Option.exists(type, (stated) => stated.join(" ") === values.join(" ")),
          ),
          `${where} states the values ${values.join(" ")}, which no declaration of it does`,
        );
      }
    }
  }

  return kept;
};

describe("vocab/derive/derive.ts over inline schemas", () => {
  it.effect(
    "resolves an xs:include against the including pin's URL, and refuses one no pin is",
    () =>
      Effect.gen(function* includes() {
        assert.deepStrictEqual(
          valueOf(includesOf(mathmlSource, yield* including("mathml3-common.xsd"))),
          ["mathml/mathml3-common.xsd"],
        );
        assert.deepStrictEqual(
          valueOf(
            includesOf(
              mathmlSource,
              yield* including("../../../../ssml/v1p1/schema/xsd/ssmlv1p1-core.xsd"),
            ),
          ),
          ["ssml/ssmlv1p1-core.xsd"],
        );
        assert.include(
          failureOf(includesOf(mathmlSource, yield* including("mathml3-extra.xsd"))),
          "https://purl.imsglobal.org/spec/mathml/v3p0/schema/xsd/mathml3-extra.xsd, a file no pin",
        );
      }),
  );

  it.effect("refuses an xs:redefine rather than read the schema without it", () =>
    Effect.gen(function* redefine() {
      const document = yield* parse(
        `${schemaTag()}<xs:redefine schemaLocation="mathml3-common.xsd"/></xs:schema>`,
      );

      assert.include(failureOf(includesOf(mathmlSource, document)), "has an xs:redefine");
    }),
  );

  it.effect("indexes included documents as one schema, refusing a second target or name", () =>
    Effect.gen(function* merge() {
      const holder = yield* parse(
        `${schemaTag()}<xs:complexType name="Holder"><xs:sequence><xs:element ref="t:item"/></xs:sequence></xs:complexType></xs:schema>`,
      );
      const declarer = yield* parse(
        `${schemaTag()}<xs:element name="item"/><xs:complexType name="Other"/></xs:schema>`,
      );
      const schema = valueOf(indexSchemas([holder, declarer]));

      assert.deepStrictEqual([...schema.complexTypes.keys()], ["Holder", "Other"]);
      assert.deepStrictEqual([...schema.elements.keys()], ["item"]);
      assert.strictEqual(schema.targetPrefix, "t");
      assert.include(
        failureOf(indexSchemas([holder, yield* parse(`${schemaTag("urn:u")}</xs:schema>`)])),
        'the target namespace "urn:u"',
      );
      assert.include(
        failureOf(indexSchemas([holder, holder])),
        "both declare a top-level xs:complexType Holder",
      );
    }),
  );

  it.effect(
    "reads a substitution group head as its members, as one choice unless a choice holds it",
    () =>
      Effect.gen(function* substitution() {
        const schema = valueOf(
          indexSchema(
            yield* parse(
              `${schemaTag()}<xs:element name="head" abstract="true"/><xs:element name="a" substitutionGroup="t:head"/><xs:element name="b" substitutionGroup="t:head"/><xs:element name="c"/>` +
                `<xs:complexType name="Run"><xs:sequence><xs:element ref="t:head" maxOccurs="unbounded"/></xs:sequence></xs:complexType>` +
                `<xs:complexType name="Pick"><xs:choice><xs:element ref="t:head"/><xs:element ref="t:c"/></xs:choice></xs:complexType>` +
                `<xs:complexType name="Local"><xs:sequence><xs:element name="d"/></xs:sequence></xs:complexType></xs:schema>`,
            ),
          ),
        );
        const many = { max: Option.none(), min: 1 };
        const one = { max: Option.some(1), min: 1 };

        assert.deepStrictEqual(contentOfType(schema, "Run"), {
          choices: [{ names: ["t:a", "t:b"], occurs: many }],
          references: [
            { name: "t:a", occurs: many },
            { name: "t:b", occurs: many },
          ],
          wildcard: false,
        });
        assert.deepStrictEqual(contentOfType(schema, "Pick").choices, [
          { names: ["t:a", "t:b", "t:c"], occurs: one },
        ]);
        assert.deepStrictEqual(contentOfType(schema, "Local").references, [
          { name: "t:d", occurs: one },
        ]);
      }),
  );

  it.effect("keeps an anonymous type's definition and spells each built-in xs:", () =>
    Effect.gen(function* inlineTypes() {
      const schema = valueOf(
        indexSchema(
          yield* parse(
            `<xsd:schema xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:t="urn:t" targetNamespace="urn:t" elementFormDefault="qualified">` +
              `<xsd:simpleType name="length"><xsd:restriction base="xsd:string"/></xsd:simpleType>` +
              `<xsd:complexType name="Holder">` +
              `<xsd:attribute name="named" type="xsd:token"/>` +
              `<xsd:attribute name="pick" default="b"><xsd:simpleType><xsd:restriction base="xsd:token"><xsd:enumeration value="a"/><xsd:enumeration value="b"/></xsd:restriction></xsd:simpleType></xsd:attribute>` +
              `<xsd:attribute name="sizes"><xsd:simpleType><xsd:restriction><xsd:simpleType><xsd:list itemType="t:length"/></xsd:simpleType><xsd:minLength value="1"/></xsd:restriction></xsd:simpleType></xsd:attribute>` +
              `<xsd:attribute name="size"><xsd:simpleType><xsd:union memberTypes="t:length"><xsd:simpleType><xsd:restriction base="xsd:token"><xsd:enumeration value="auto"/></xsd:restriction></xsd:simpleType></xsd:union></xsd:simpleType></xsd:attribute>` +
              `</xsd:complexType></xsd:schema>`,
          ),
        ),
      );
      const entry = entryOfType(schema, "Holder");
      const typed = (name: string) => {
        const { inline, type, whiteSpace } = rowOf(entry, name);

        return { inline: Option.getOrNull(inline), type, whiteSpace };
      };

      assert.deepStrictEqual(typed("named"), {
        inline: null,
        type: "xs:token",
        whiteSpace: "collapse",
      });
      assert.deepStrictEqual(typed("pick"), {
        inline: enumeration("xs:token", ["a", "b"]),
        type: "xs:token",
        whiteSpace: "collapse",
      });
      assert.deepStrictEqual(rowOf(entry, "pick").default, Option.some("b"));
      assert.deepStrictEqual(typed("sizes"), {
        inline: {
          _tag: "restriction",
          base: { _tag: "list", item: named("t:length") },
          facets: [{ facet: "minLength", value: "1" }],
        },
        type: "list",
        whiteSpace: "collapse",
      });
      assert.deepStrictEqual(typed("size"), {
        inline: { _tag: "union", members: [named("t:length"), enumeration("xs:token", ["auto"])] },
        type: "union",
        whiteSpace: "union",
      });
    }),
  );

  it.effect("refuses an anonymous restriction that holds an element no facet is", () =>
    Effect.gen(function* notAFacet() {
      const schema = valueOf(
        indexSchema(
          yield* parse(
            `${schemaTag()}<xs:complexType name="Holder"><xs:attribute name="a"><xs:simpleType><xs:restriction base="xs:string"><xs:assertion test="true()"/></xs:restriction></xs:simpleType></xs:attribute></xs:complexType></xs:schema>`,
          ),
        ),
      );

      assert.include(
        failureOf(entryOf(schema, { element: "Holder", handle: "Holder", type: "t:Holder" })),
        "an xs:restriction holds an xs:assertion, which is no XSD facet",
      );
    }),
  );

  it.effect("classes content as text, mixed, element, wildcard or empty", () =>
    Effect.gen(function* contentClasses() {
      const schema = valueOf(
        indexSchema(
          yield* parse(
            `${schemaTag()}<xs:complexType name="Text"><xs:simpleContent><xs:extension base="xs:normalizedString"><xs:attribute name="a" type="xs:string"/></xs:extension></xs:simpleContent></xs:complexType>` +
              `<xs:complexType name="Inherited"><xs:simpleContent><xs:extension base="t:Text"/></xs:simpleContent></xs:complexType>` +
              `<xs:complexType name="Mixed" mixed="true"><xs:sequence><xs:element name="e"/></xs:sequence></xs:complexType>` +
              `<xs:complexType name="Elements"><xs:sequence><xs:element name="e"/><xs:any namespace="##other"/></xs:sequence></xs:complexType>` +
              `<xs:complexType name="Wild"><xs:sequence><xs:any namespace="##other" maxOccurs="unbounded"/></xs:sequence></xs:complexType>` +
              `<xs:complexType name="Empty"><xs:attribute name="a" type="xs:string"/></xs:complexType>` +
              `</xs:schema>`,
          ),
        ),
      );
      const text = textOf("xs:normalizedString", "replace");

      assert.deepStrictEqual(
        ["Text", "Inherited", "Mixed", "Elements", "Wild", "Empty"].map(
          (type) => entryOfType(schema, type).content,
        ),
        [
          text,
          text,
          { _tag: "mixed" },
          { _tag: "element" },
          { _tag: "wildcard" },
          { _tag: "empty" },
        ],
      );
    }),
  );
});

if (Option.isSome(absence)) {
  it("derives the vocabulary data from the pinned XSDs", (context) => {
    context.skip(`the XSD cache is incomplete: ${absence.value.message}`);
  });
}

describe.skipIf(Option.isSome(absence))("vocab/derive/derive.ts over the pinned XSDs", () => {
  layer(
    Layer.mergeAll(
      SchemasLayer.pipe(Layer.provide(Layer.mergeAll(NodeServices.layer, Digest.layerWebCrypto))),
      NodeServices.layer,
    ),
    { timeout: schemasHookTimeoutMs },
  )("from the cache", (cached) => {
    cached.effect("reads every pinned XSD through its pin, XInclude's UTF-16 included", () =>
      Effect.gen(function* everySource() {
        const { documents } = yield* Schemas;

        assert.deepStrictEqual([...documents.keys()], sourcePaths);
        for (const document of documents.values()) {
          assert.strictEqual(document.root.local, "schema");
          assert.strictEqual(document.root.namespace, "http://www.w3.org/2001/XMLSchema");
        }

        assert.strictEqual(documents.get("w3/XInclude.xsd")?.charset, "UTF-16");
      }),
    );

    cached.effect(
      "reads 64 expression kinds' arity from the ASI 3.0 XSD, 50 bounded and 14 not, as OperatorArity's facet states it",
      () =>
        // Oracle: a second reading. `aritiesOf` reads the arity from the content-model IR
        // (`#pantry/grammar/facets.ts`, the rows `OperatorArity` holds); `arityOf` reads it from
        // the XSD's own particles. Both are keyed sets of (kind, min, max), compared whole, and a
        // repeated row fails either side.
        Effect.gen(function* arity() {
          const { asi300 } = yield* Schemas;
          const rows = valueOf(arityOf(asi300));
          const derived = new Map(
            rows.map((row) => {
              const held: ArityRow = {
                kind: row.kind,
                max: Option.match(row.max, { onNone: () => int8Max, onSome: BigInt }),
                min: BigInt(row.min),
              };

              return [arityKey(held), held] as const;
            }),
          );
          const stated = new Map(
            asiFacet.expression.arities.map((row) => [arityKey(row), row] as const),
          );

          assert.deepStrictEqual(
            [rows.length, rows.filter((row) => Option.isSome(row.max)).length],
            [64, 50],
          );
          assert.strictEqual(derived.size, rows.length, "the XSD reading repeats a row");
          assert.strictEqual(
            stated.size,
            asiFacet.expression.arities.length,
            "the facet repeats a row",
          );
          assert.deepStrictEqual([...derived.keys()].toSorted(), [...stated.keys()].toSorted());
        }),
    );

    cached.effect("keeps the anonymous attribute types of the ASI leaves as declared", () =>
      Effect.gen(function* inlineTypesFromXsd() {
        const { asi301, documents } = yield* Schemas;
        const asiDocument = Option.getOrElse(
          Option.fromNullishOr(documents.get("imsqti_asiv3p0p1_v1p0.xsd")),
          () => assert.fail("the ASI 3.0.1 XSD was not read"),
        );
        const kept = leaves.map((leaf) =>
          checkInlineTypes(valueOf(entriesOf(asi301, leaf)), [asiDocument.root]),
        );
        assert.deepStrictEqual(kept, [635, 1133, 38]);
      }),
    );

    cached.effect("reads simple content's text type and inline enumerations' values", () =>
      Effect.gen(function* textAndValues() {
        const { asi301 } = yield* Schemas;
        const asi = leaves.flatMap((leaf) => valueOf(entriesOf(asi301, leaf)));
        const values = (entries: readonly Entry[], handle: string, name: string) =>
          rowOf(entryNamed(entries, handle), name).inline.pipe(Option.map(enumerationsOf));
        assert.deepStrictEqual(
          entryNamed(asi, "qti-value").content,
          textOf("xs:normalizedString", "replace"),
        );
        assert.deepStrictEqual(
          entryNamed(asi, "qti-base-value").content,
          textOf("xs:string", "preserve"),
        );
        assert.deepStrictEqual(
          values(asi, "qti-value", "base-type"),
          Option.some([
            "boolean",
            "directedPair",
            "duration",
            "file",
            "float",
            "identifier",
            "integer",
            "pair",
            "point",
            "string",
            "uri",
          ]),
        );
        assert.deepStrictEqual(values(asi, "p", "dir"), Option.some(["ltr", "rtl", "auto"]));
      }),
    );

    cached.effect("finds m3:math under 61 elements in 34 types, in 3.0.0 and 3.0.1 alike", () =>
      // Oracle: the ASI XSDs' own declarations. Reading 2 makes `m:math` MathML's one root, so the
      // QTI elements whose content names it are where MathML may start, the same in both versions.
      Effect.gen(function* mathHosts() {
        const { asi300, asi301 } = yield* Schemas;
        const hosts = hostsOf(asi301, "m3:math");

        assert.deepStrictEqual(
          [...hostsOf(asi300, "m3:math").keys()].toSorted(),
          [...hosts.keys()].toSorted(),
        );
        assert.deepStrictEqual(
          [
            hosts.size,
            new Set([...hosts.values()].map((host) => host.element)).size,
            new Set([...hosts.values()].map((host) => host.type)).size,
          ],
          [68, 61, 34],
        );
      }),
    );
  });
});

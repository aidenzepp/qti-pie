import { NodeServices } from "@effect/platform-node";
import { assert, describe, it, layer } from "@effect/vitest";
import { Array as Arr, Context, Effect, Layer, Option, Result } from "effect";
import { Digest } from "effect/crypto";
import type { Attribute, Element } from "@qti-pie/crust/tree.ts";
import { openClasses } from "#pantry/grammar/kinds.ts";
import type { XdmOpenName } from "#pantry/model/xdm.ts";
import { indexSchema } from "#pantry/vocab/derive/derive.ts";
import type { XsdSchema } from "#pantry/vocab/derive/derive.ts";
import { checkCache, readSource } from "#pantry/vocab/derive/sources.ts";
import type { SourcePath } from "#pantry/vocab/derive/sources.ts";
import {
  dataName,
  OpenNameRefused,
  openNameRefusals,
  openNameOf,
  wildcardOf,
  wildcards,
} from "#pantry/vocab/open.ts";
import type { OpenNameRefusal, Wildcard, WildcardVersion } from "#pantry/vocab/open.ts";

/**
 * The QTI namespace, which the ASI XSDs' elements are in.
 */
const asi = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

/**
 * The XInclude namespace.
 */
const xinclude = "http://www.w3.org/2001/XInclude";

/**
 * The namespace `xml.xsd` declares its attributes in.
 */
const xml = "http://www.w3.org/XML/1998/namespace";

/**
 * XML Schema's instance namespace.
 */
const xsi = "http://www.w3.org/2001/XMLSchema-instance";

/**
 * The extension namespace of the corpus's MathAssess custom operator (`ma:syntax`,
 * `ma:returnType`).
 */
const mathassess = "http://mathassess.qtitools.org/xsd/mathassess";

/**
 * What reading one attribute gives: its open name, or the reason it has none.
 */
type Reading = { readonly open: XdmOpenName } | { readonly refused: OpenNameRefusal };

/**
 * Name an attribute as the reader resolves it, from its qualified name and namespace name.
 *
 * @param attribute - The qualified name as written, and the namespace name its prefix is bound to.
 * @returns The name, its prefix and local name split from the qualified name at its colon.
 */
const nameOf = (attribute: {
  readonly namespace: string;
  readonly qname: string;
}): Pick<Attribute, "local" | "namespace" | "prefix" | "qname"> => {
  const colon = attribute.qname.indexOf(":");

  return {
    local: attribute.qname.slice(colon + 1),
    namespace: attribute.namespace,
    prefix: colon === -1 ? "" : attribute.qname.slice(0, colon),
    qname: attribute.qname,
  };
};

/**
 * Turn an attribute's reading into a plain value for comparison.
 *
 * @param result - What {@link openNameOf} gave.
 * @returns The open name, or the refusal's reason.
 */
const readingOf = (result: Result.Result<XdmOpenName, OpenNameRefused>): Reading =>
  Result.match(result, {
    onFailure: (refusal) => ({ refused: refusal.reason }),
    onSuccess: (open) => ({ open }),
  });

/**
 * Read an attribute on an element of a schema version, through the element's stated wildcard.
 *
 * @param version - The document's version.
 * @param element - The element's namespace name and local name.
 * @param attribute - The attribute's qualified name and its namespace name.
 * @returns The reading.
 */
const read = (
  version: WildcardVersion,
  element: Pick<Element, "local" | "namespace">,
  attribute: { readonly namespace: string; readonly qname: string },
): Reading => readingOf(openNameOf(element, wildcardOf(version, element), nameOf(attribute)));

/**
 * The QTI-namespace elements a version's statements give a wildcard of the given namespaces.
 *
 * @param version - The schema version.
 * @param namespaces - The wildcard's namespace constraint.
 * @returns The elements' local names, sorted.
 */
const asiElementsWith = (
  version: WildcardVersion,
  namespaces: Wildcard["namespaces"],
): readonly string[] =>
  wildcards
    .flatMap((statement) =>
      statement.namespace === asi &&
      statement.wildcard.namespaces === namespaces &&
      statement.versions.some((stated) => stated === version)
        ? statement.elements
        : [],
    )
    .toSorted();

describe("vocab/open.ts", () => {
  it("tags the three classes with the AttributeName roster's open-class handles", () => {
    const tags = [
      read("3.0.1", { local: "p", namespace: asi }, { namespace: "", qname: "data-x" }),
      read("3.0.1", { local: "p", namespace: asi }, { namespace: "urn:v", qname: "v:x" }),
      read("3.0.1", { local: "p", namespace: asi }, { namespace: "", qname: "x" }),
    ].map((reading) => ("open" in reading ? reading.open._tag : assert.fail(reading.refused)));

    assert.deepStrictEqual(tags, [...openClasses]);
  });

  it("states each element once per version, each statement in code-point order", () => {
    const keys = wildcards.flatMap(({ elements, namespace, versions }) =>
      versions.flatMap((version) => elements.map((local) => `${version} {${namespace}}${local}`)),
    );

    assert.strictEqual(new Set(keys).size, keys.length);
    for (const { elements } of wildcards) {
      const listed: readonly string[] = elements;

      assert.deepStrictEqual(listed, listed.toSorted());
    }
  });

  it("gives no-namespace attributes to 127 elements in 3.0.1 and the same but one in 3.0.0", () => {
    const current = asiElementsWith("3.0.1", "any");
    const earlier = asiElementsWith("3.0.0", "any");

    assert.strictEqual(current.length, 127);
    assert.strictEqual(earlier.length, 126);
    assert.deepStrictEqual(
      current.filter((local) => !earlier.includes(local)),
      ["qti-stimulus-body"],
    );
    assert.isTrue(earlier.every((local) => current.includes(local)));
  });

  it("matches the data-* names of spec reading 13 and no others", () => {
    for (const name of ["data-x", "data-dimension1_initial", "data-a.b-c", "data-0", "data--"]) {
      assert.isTrue(dataName.test(name), name);
    }

    for (const name of ["data-", "data", "data-Foo", "data-é", "data-x y", "DATA-x", "xdata-x"]) {
      assert.isFalse(dataName.test(name), name);
    }
  });

  it("reads the corpus's open attributes in their classes", () => {
    const cases: readonly (readonly [Reading, Reading])[] = [
      [
        read("3.0.0", { local: "object", namespace: asi }, { namespace: "", qname: "alt" }),
        { open: { _tag: "lax", local: "alt" } },
      ],
      [
        read(
          "3.0.0",
          { local: "qti-extended-text-interaction", namespace: asi },
          { namespace: "", qname: "patternMask" },
        ),
        { open: { _tag: "lax", local: "patternMask" } },
      ],
      [
        read(
          "3.0.0",
          { local: "qti-portable-custom-interaction", namespace: asi },
          { namespace: "", qname: "data-dimension1_initial" },
        ),
        { open: { _tag: "data-*", local: "data-dimension1_initial" } },
      ],
      [
        read(
          "3.0.0",
          { local: "qti-card-entry", namespace: asi },
          { namespace: "", qname: "data-reading-type" },
        ),
        { open: { _tag: "data-*", local: "data-reading-type" } },
      ],
      [
        read(
          "3.0.0",
          { local: "qti-custom-operator", namespace: asi },
          { namespace: mathassess, qname: "ma:syntax" },
        ),
        { open: { _tag: "foreign", local: "syntax", prefix: "ma", uri: mathassess } },
      ],
    ];

    for (const [actual, expected] of cases) {
      assert.deepStrictEqual(actual, expected);
    }
  });

  it("reads a namespaced name as foreign wherever an element admits other namespaces", () => {
    const foreign = { open: { _tag: "foreign", local: "x", prefix: "v", uri: "urn:v" } } as const;
    const name = { namespace: "urn:v", qname: "v:x" };

    assert.deepStrictEqual(read("3.0.1", { local: "p", namespace: asi }, name), foreign);
    assert.deepStrictEqual(
      read("3.0.1", { local: "qti-custom-interaction", namespace: asi }, name),
      foreign,
    );
    assert.deepStrictEqual(read("3.0.0", { local: "include", namespace: xinclude }, name), foreign);
    assert.deepStrictEqual(
      read("3.0.1", { local: "p", namespace: asi }, { namespace: "urn:v", qname: "v:data-X" }),
      { open: { _tag: "foreign", local: "data-X", prefix: "v", uri: "urn:v" } },
    );
    assert.deepStrictEqual(
      read("3.0.1", { local: "p", namespace: asi }, { namespace: asi, qname: "qti:x" }),
      { open: { _tag: "foreign", local: "x", prefix: "qti", uri: asi } },
    );
  });

  it("follows the document's version for an element whose wildcard 3.0.1 adds", () => {
    const element = { local: "qti-stimulus-body", namespace: asi };
    const name = { namespace: "", qname: "data-x" };

    assert.deepStrictEqual(read("3.0.0", element, name), { refused: "closed-element" });
    assert.deepStrictEqual(read("3.0.1", element, name), {
      open: { _tag: "data-*", local: "data-x" },
    });
  });

  it("refuses what the element's wildcard does not let through unvalidated", () => {
    const cases: readonly (readonly [Reading, OpenNameRefusal])[] = [
      [
        read(
          "3.0.1",
          { local: "qti-item-body", namespace: asi },
          { namespace: "", qname: "data-x" },
        ),
        "closed-element",
      ],
      [
        read(
          "3.0.1",
          { local: "qti-custom-operator", namespace: asi },
          { namespace: "", qname: "data-x" },
        ),
        "outside-namespaces",
      ],
      [
        read(
          "3.0.1",
          { local: "qti-custom-operator", namespace: asi },
          { namespace: asi, qname: "qti:x" },
        ),
        "outside-namespaces",
      ],
      [
        read("3.0.1", { local: "include", namespace: xinclude }, { namespace: "", qname: "x" }),
        "outside-namespaces",
      ],
      [
        read(
          "3.0.1",
          { local: "qti-ordering", namespace: asi },
          { namespace: mathassess, qname: "ma:x" },
        ),
        "strict",
      ],
      [
        read(
          "3.0.1",
          { local: "qti-ordering", namespace: asi },
          { namespace: xml, qname: "xml:space" },
        ),
        "declared",
      ],
      [
        read("3.0.1", { local: "p", namespace: asi }, { namespace: xml, qname: "xml:id" }),
        "declared",
      ],
      [
        read("3.0.1", { local: "p", namespace: asi }, { namespace: xsi, qname: "xsi:type" }),
        "declared",
      ],
      [
        read(
          "3.0.1",
          { local: "qti-item-body", namespace: asi },
          { namespace: xsi, qname: "xsi:nil" },
        ),
        "declared",
      ],
      [
        read("3.0.1", { local: "p", namespace: asi }, { namespace: "", qname: "data-Foo" }),
        "data-name",
      ],
      [
        read("3.0.1", { local: "p", namespace: asi }, { namespace: "", qname: "data-" }),
        "data-name",
      ],
    ];

    for (const [actual, reason] of cases) {
      assert.deepStrictEqual(actual, { refused: reason });
    }
  });

  it("lets a skip wildcard through unvalidated, the XML namespace included", () => {
    const skip = Option.some({ namespaces: "other", processing: "skip" } as const);
    const element = { local: "mi", namespace: "http://www.w3.org/1998/Math/MathML" };

    assert.deepStrictEqual(
      readingOf(openNameOf(element, skip, nameOf({ namespace: xml, qname: "xml:lang" }))),
      { open: { _tag: "foreign", local: "lang", prefix: "xml", uri: xml } },
    );
    assert.deepStrictEqual(
      readingOf(openNameOf(element, skip, nameOf({ namespace: xsi, qname: "xsi:type" }))),
      { refused: "declared" },
    );
  });

  it("names the attribute and the element in every refusal's message", () => {
    for (const reason of openNameRefusals) {
      const { message } = new OpenNameRefused({
        attribute: "v:data-Foo",
        element: "qti-ordering",
        namespace: "urn:v",
        reason,
      });

      assert.include(message, "v:data-Foo", reason);
      assert.include(message, reason === "data-name" ? "reading 13" : "qti-ordering", reason);
    }
  });
});

/**
 * The XML Schema namespace, which every construct the derivation reads is in.
 */
const XS = "http://www.w3.org/2001/XMLSchema";

/**
 * The 3.0.1 ASI XSD, the one that names its lax wildcard's group `extensionAnyTypeLax.Attr`.
 */
const read301 = "imsqti_asiv3p0p1_v1p0.xsd" satisfies SourcePath;

/**
 * The pinned XSDs the statements cover: each version's ASI XSD, and the XInclude XSD both import.
 */
const derivedFrom = [
  "imsqti_asiv3p0_v1p0.xsd",
  read301,
  "w3/XInclude.xsd",
] as const satisfies readonly SourcePath[];

/**
 * Why the cache-gated suite cannot run here: the cache's message when one of {@link derivedFrom}
 * is absent, `None` when all three are present. Any other failure of the check fails the file's
 * load.
 */
const absence = await Effect.runPromise(
  checkCache().pipe(
    Effect.as(Option.none<string>()),
    Effect.catchTag("XsdSourceMissing", (missing) =>
      Effect.succeed(
        missing.missing.some(({ path }) => new Set<string>(derivedFrom).has(path))
          ? Option.some(missing.message)
          : Option.none(),
      ),
    ),
    Effect.provide(NodeServices.layer),
  ),
);

/**
 * The timeout, in milliseconds, for the hook that reads and indexes the three XSDs.
 *
 * The two ASI XSDs are 18 MB each and take nearly all of it. Measured on 2026-11-05 on a 10-CPU M2
 * Max at load averages of 11, with other suites running: in three runs the file's tests, nearly all
 * of their time this hook, took 3.1 to 4.2 s. The budget is the larger of twice that maximum
 * (8.4 s) and 20 s, the floor being twice vitest's default hook timeout. Raise it only on a new
 * measurement recorded here, never to make a run pass.
 */
const schemasHookTimeoutMs = 20_000;

/**
 * The three XSDs as read once for the suite, each indexed, with its root element.
 */
class Schemas extends Context.Service<
  Schemas,
  { readonly [Path in (typeof derivedFrom)[number]]: { root: Element; schema: XsdSchema } }
>()("vocab/open.test/Schemas") {}

/**
 * Read one of the three XSDs through its pin and index it.
 *
 * @param path - The pinned file.
 * @returns Its root element and its index.
 */
const load = (path: (typeof derivedFrom)[number]) =>
  readSource(path).pipe(
    Effect.flatMap((document) =>
      Effect.fromResult(
        Result.map(indexSchema(document), (schema) => ({ root: document.root, schema })),
      ),
    ),
  );

/**
 * Read the three XSDs through their pins and index each.
 */
const SchemasLayer = Layer.effect(
  Schemas,
  Effect.gen(function* readSchemas() {
    return Schemas.of(
      yield* Effect.all(
        {
          "imsqti_asiv3p0_v1p0.xsd": load("imsqti_asiv3p0_v1p0.xsd"),
          "imsqti_asiv3p0p1_v1p0.xsd": load(read301),
          "w3/XInclude.xsd": load("w3/XInclude.xsd"),
        },
        { concurrency: "unbounded" },
      ),
    );
  }),
);

/**
 * The element children of an element, in document order.
 *
 * @param node - The parent element.
 * @returns Its children that are elements.
 */
const elementsOf = (node: Element): readonly Element[] =>
  node.children.flatMap((child) => (child.kind === "element" ? [child] : []));

/**
 * The children of an element that are the XSD construct named `local`.
 *
 * @param node - The parent element.
 * @param local - The construct's local name, such as `anyAttribute`.
 * @returns The matching children, in document order.
 */
const xsChildren = (node: Element, local: string): readonly Element[] =>
  elementsOf(node).filter((child) => child.namespace === XS && child.local === local);

/**
 * The value of an element's attribute that is in no namespace.
 *
 * @param node - The element.
 * @param name - The attribute's local name.
 * @returns The value, or `None` when the element has no such attribute.
 */
const attributeOf = (node: Element, name: string): Option.Option<string> =>
  Arr.findFirst(
    node.attributes,
    (attribute) => attribute.namespace === "" && attribute.local === name,
  ).pipe(Option.map((attribute) => attribute.value));

/**
 * A QName that names a type, an attribute group or a built-in: whether it is an XML Schema
 * built-in, and its local name.
 */
interface ResolvedName {
  readonly builtin: boolean;
  readonly local: string;
}

/**
 * Resolve a QName-valued attribute through the namespaces the `xs:schema` element declares.
 *
 * @param schema - The schema the value is written in.
 * @param lexical - The value as written, such as `xs:string` or `xi:includeType`.
 * @returns The name it resolves to; the test fails for a name in a namespace other than the
 *   schema's own and XML Schema's.
 */
const resolve = (schema: XsdSchema, lexical: string): ResolvedName => {
  const colon = lexical.indexOf(":");
  const namespace = schema.namespaces.get(colon === -1 ? "" : lexical.slice(0, colon));

  if (namespace !== XS && namespace !== schema.targetNamespace) {
    assert.fail(`${lexical} names a component outside this schema and XML Schema`);
  }

  return { builtin: namespace === XS, local: lexical.slice(colon + 1) };
};

/**
 * A top-level component that a QName-valued attribute names in the schema's own namespace.
 *
 * @param schema - The schema the value is written in.
 * @param components - The component map of the kind the value names.
 * @param lexical - The value as written.
 * @returns The component, or `None` for a built-in; the test fails for an undeclared name.
 */
const componentOf = (
  schema: XsdSchema,
  components: ReadonlyMap<string, Element>,
  lexical: string,
): Option.Option<Element> => {
  const { builtin, local } = resolve(schema, lexical);
  const component = components.get(local);

  if (builtin) {
    return Option.none();
  }

  if (component === undefined) {
    return assert.fail(`no top-level component ${lexical} is declared`);
  }

  return Option.some(component);
};

/**
 * The wildcard an `xs:anyAttribute` states.
 *
 * @param node - The `xs:anyAttribute` element.
 * @returns Its namespace constraint and processing; the test fails for a constraint other than
 *   `##any` and `##other`.
 */
const wildcardFrom = (node: Element): Wildcard => {
  const namespace = Option.getOrElse(attributeOf(node, "namespace"), () => "##any");
  const processing = Option.getOrElse(attributeOf(node, "processContents"), () => "strict");

  if (namespace !== "##any" && namespace !== "##other") {
    return assert.fail(`an xs:anyAttribute has namespace="${namespace}"`);
  }

  if (processing !== "lax" && processing !== "skip" && processing !== "strict") {
    return assert.fail(`an xs:anyAttribute has processContents="${processing}"`);
  }

  return { namespaces: namespace === "##any" ? "any" : "other", processing };
};

/**
 * The attribute groups a holder references, its groups' references included, in reading order.
 *
 * @param schema - The schema the holder is in.
 * @param holder - A complex type, a derivation step or an attribute group.
 * @returns The groups.
 */
const groupsOf = (schema: XsdSchema, holder: Element): readonly Element[] =>
  xsChildren(holder, "attributeGroup").flatMap((reference) =>
    Option.match(attributeOf(reference, "ref"), {
      onNone: () => assert.fail("an xs:attributeGroup reference has no ref"),
      onSome: (ref) =>
        Option.match(componentOf(schema, schema.attributeGroups, ref), {
          onNone: () => assert.fail(`the attribute group ${ref} is a built-in`),
          onSome: (group) => [group, ...groupsOf(schema, group)],
        }),
    }),
  );

/**
 * The wildcard holders state themselves, the local wildcard of XML Schema 1.0 §3.4.2: each one's
 * `xs:anyAttribute` and its attribute groups'.
 *
 * @param schema - The schema the holders are in.
 * @param holders - The holders: a complex type, and its derivation step when it has one.
 * @returns The one wildcard they state, or `None`; the test fails for two, whose intersection the
 *   pinned XSDs never need.
 */
const completeWildcard = (
  schema: XsdSchema,
  holders: readonly Element[],
): Option.Option<Wildcard> => {
  const found = holders.flatMap((holder) =>
    [holder, ...groupsOf(schema, holder)].flatMap((node) =>
      xsChildren(node, "anyAttribute").map(wildcardFrom),
    ),
  );

  if (found.length > 1) {
    assert.fail(
      `a type states ${found.length} attribute wildcards, whose intersection is not read`,
    );
  }

  return Arr.head(found);
};

/**
 * The derivation step of a complex type: the `extension` or `restriction` of its
 * `complexContent` or `simpleContent`.
 *
 * @param complexType - The `xs:complexType` element.
 * @returns The step, or `None` for a type with neither content child.
 */
const stepOf = (complexType: Element): Option.Option<Element> =>
  Arr.head(
    [
      ...xsChildren(complexType, "complexContent"),
      ...xsChildren(complexType, "simpleContent"),
    ].flatMap((content) => [
      ...xsChildren(content, "extension"),
      ...xsChildren(content, "restriction"),
    ]),
  );

/**
 * The attribute wildcard of a complex type, as XML Schema 1.0 §3.4.2 builds it.
 *
 * A restriction holds its complete wildcard alone. An extension holds the union of its complete
 * wildcard and its base type's, with the complete wildcard's processing: `any` when either is
 * `any`, else `other` (both are this schema's, so they exclude the same namespace).
 *
 * @param schema - The schema the type is in.
 * @param complexType - The `xs:complexType` element.
 * @returns The wildcard, or `None` when the type admits only its declared attributes.
 */
const wildcardOfType = (schema: XsdSchema, complexType: Element): Option.Option<Wildcard> => {
  const step = stepOf(complexType);
  const complete = completeWildcard(schema, [complexType, ...Option.toArray(step)]);

  if (Option.isNone(step) || step.value.local === "restriction") {
    return complete;
  }

  const base = Option.getOrElse(attributeOf(step.value, "base"), () =>
    assert.fail("an xs:extension has no base"),
  );

  const { builtin, local } = resolve(schema, base);

  if (builtin && local === "anyType") {
    assert.fail("an extension of xs:anyType, whose wildcard is not read");
  }

  const inherited = Option.flatMap(componentOf(schema, schema.complexTypes, base), (type) =>
    wildcardOfType(schema, type),
  );

  return Option.match(complete, {
    onNone: () => inherited,
    onSome: (own) =>
      Option.some({
        namespaces: Option.exists(inherited, (wildcard) => wildcard.namespaces === "any")
          ? "any"
          : own.namespaces,
        processing: own.processing,
      }),
  });
};

/**
 * The attribute wildcard of every element a schema declares with a named type.
 *
 * @param schema - The schema.
 * @returns Each element that holds a wildcard, by local name; the test fails for an element whose
 *   declared types hold different ones.
 */
const elementWildcards = (schema: XsdSchema): ReadonlyMap<string, Wildcard> =>
  new Map(
    [...schema.declarations].flatMap(([element, types]) => {
      const held = types.map((type) => {
        const { builtin, local } = resolve(schema, type);

        return builtin || schema.simpleTypes.has(local)
          ? Option.none()
          : Option.flatMap(componentOf(schema, schema.complexTypes, type), (complexType) =>
              wildcardOfType(schema, complexType),
            );
      });
      const distinct = Arr.dedupeWith(held, (a, b) => JSON.stringify(a) === JSON.stringify(b));

      if (distinct.length !== 1) {
        assert.fail(`the types of ${element} (${types.join(", ")}) hold different wildcards`);
      }

      return distinct.flatMap((wildcard) =>
        Option.match(wildcard, {
          onNone: () => [],
          onSome: (value) => [[element, value] as const],
        }),
      );
    }),
  );

/**
 * Whether a schema declares an element with an anonymous complex type, whose wildcard
 * {@link elementWildcards} does not see.
 *
 * @param node - The element to search from.
 * @returns Whether an `xs:element` at or below it holds an `xs:complexType`.
 */
const holdsAnonymousType = (node: Element): boolean =>
  (node.namespace === XS &&
    node.local === "element" &&
    xsChildren(node, "complexType").length > 0) ||
  elementsOf(node).some(holdsAnonymousType);

/**
 * Write one element's wildcard under a version as a line, for comparing statements as text.
 *
 * @param version - The schema version.
 * @param namespace - The element's namespace name.
 * @param local - The element's local name.
 * @param wildcard - Its wildcard.
 * @returns The line.
 */
const lineOf = (version: string, namespace: string, local: string, wildcard: Wildcard): string =>
  `${version} {${namespace}}${local} ${wildcard.namespaces}/${wildcard.processing}`;

if (Option.isSome(absence)) {
  it("derives the wildcard statements from the pinned XSDs", (context) => {
    context.skip(`the XSD cache is incomplete: ${absence.value}`);
  });
}

describe.skipIf(Option.isSome(absence))("vocab/open.ts over the pinned XSDs", () => {
  layer(
    SchemasLayer.pipe(Layer.provide(Layer.mergeAll(NodeServices.layer, Digest.layerWebCrypto))),
    {
      timeout: schemasHookTimeoutMs,
    },
  )("from the cache", (cached) => {
    cached.effect("states exactly the wildcards the XSDs give their elements", () =>
      Effect.gen(function* statements() {
        const schemas = yield* Schemas;
        const derived = [
          ["3.0.0", schemas["imsqti_asiv3p0_v1p0.xsd"]],
          ["3.0.1", schemas["imsqti_asiv3p0p1_v1p0.xsd"]],
          ["3.0.0", schemas["w3/XInclude.xsd"]],
          ["3.0.1", schemas["w3/XInclude.xsd"]],
        ] as const;

        for (const [, { root }] of derived) {
          assert.isFalse(holdsAnonymousType(root));
        }

        const fromXsd = derived.flatMap(([version, { schema }]) =>
          [...elementWildcards(schema)].map(([local, wildcard]) =>
            lineOf(version, schema.targetNamespace, local, wildcard),
          ),
        );
        const fromStatements = wildcards.flatMap(({ elements, namespace, versions, wildcard }) =>
          versions.flatMap((version) =>
            elements.map((local) => lineOf(version, namespace, local, wildcard)),
          ),
        );

        assert.deepStrictEqual(fromStatements.toSorted(), fromXsd.toSorted());
      }),
    );

    cached.effect(
      "finds 3.0.1's no-namespace hosts to be the 127 heirs of extensionAnyTypeLax.Attr",
      () =>
        Effect.gen(function* laxHeirs() {
          const { schema } = (yield* Schemas)[read301];
          const lax = Option.getOrElse(
            Option.fromNullishOr(schema.attributeGroups.get("extensionAnyTypeLax.Attr")),
            () => assert.fail("the 3.0.1 ASI XSD declares no extensionAnyTypeLax.Attr"),
          );
          const inherits = (complexType: Element): boolean =>
            [complexType, ...Option.toArray(stepOf(complexType))].some((holder) =>
              groupsOf(schema, holder).includes(lax),
            ) ||
            Option.exists(
              stepOf(complexType),
              (step) =>
                step.local === "extension" &&
                Option.exists(
                  Option.flatMap(attributeOf(step, "base"), (base) =>
                    componentOf(schema, schema.complexTypes, base),
                  ),
                  inherits,
                ),
            );
          const heirs = [...schema.declarations]
            .filter(([, types]) =>
              types.some((type) =>
                Option.exists(
                  Option.fromNullishOr(schema.complexTypes.get(resolve(schema, type).local)),
                  inherits,
                ),
              ),
            )
            .map(([element]) => element)
            .toSorted();

          assert.strictEqual(heirs.length, 127);
          assert.deepStrictEqual(heirs, asiElementsWith("3.0.1", "any"));
        }),
    );
  });
});

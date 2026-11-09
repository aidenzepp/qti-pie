import { NodeServices } from "@effect/platform-node";
import { assert, describe, it } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { array, element, int } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Array as Arr, Duration, Effect, Formatter, Option, Result } from "effect";
import { admittedOf, governorOf, textDomainOf } from "#pantry/grammar/attributes.ts";
import { indexedSourced, roster } from "#pantry/grammar/closed.ts";
import { composed } from "#pantry/grammar/compose.ts";
import { foreignKinds, isForeignKind, schemaVersions } from "#pantry/grammar/kinds.ts";
import type { SchemaVersion } from "#pantry/grammar/kinds.ts";
import { expandedNameOf, typeHandle, typePrefixes, xsiTypesOf } from "#pantry/grammar/xsi.ts";
import type { ContentModel, ExpandedName, TypeDerivation } from "#pantry/vocab/inventory/types.ts";
import { checkCache } from "#pantry/vocab/derive/sources.ts";
import { typeDerivations } from "#pantry/vocab/inventory/models.ts";
import type { SourcePath } from "#pantry/vocab/derive/sources.ts";
import { namespaceNameOf, xsNamespace } from "#pantry/vocab/namespaces.ts";
import type { NamespaceOfKind } from "#pantry/vocab/namespaces.ts";
import {
  loadXsd,
  nameKey,
  resolverOf,
  toySources,
  validateContents,
  XsdOracleLayer,
  xsdContents,
} from "#pantry/test/gen/grammar.ts";
import type { Content, Probe, ProbeDocument, XsdSet } from "#pantry/test/gen/grammar.ts";
import type { ComposedGrammar } from "#pantry/grammar/compose.ts";

/**
 * The timeout, in milliseconds, that this file's slower tests state, each itself or through its
 * describe: a hang guard, never a budget. Measured 2026-11-07: 132.8 s at a load average of 63 to
 * 73, its slowest test.
 */
const testTimeoutMs = 600_000;

/**
 * The toy base type.
 */
const base: ExpandedName = { local: "Base", namespace: "urn:toy" };

/**
 * A toy type derived from {@link base}.
 */
const derivedType: ExpandedName = { local: "Derived", namespace: "urn:toy" };

/**
 * A toy type unrelated to the others.
 */
const other: ExpandedName = { local: "Other", namespace: "urn:toy" };

/**
 * The toy types, by the index a drawn declaration names: -1, none, is an anonymous type.
 */
const types: readonly ExpandedName[] = [base, derivedType, other];

/**
 * The toy derivations: each type validly derives from itself, and `Derived` from `Base` too, in
 * both versions (XML Schema 1.0 Part 1 §3.4.6, the reflexive and transitive closure of the base
 * chain).
 */
const derivations: readonly TypeDerivation[] = [
  { derived: [base, derivedType], type: base, versions: schemaVersions },
  { derived: [derivedType], type: derivedType, versions: schemaVersions },
  { derived: [other], type: other, versions: schemaVersions },
];

/**
 * The toy kinds' namespace, the toy types' own.
 */
const toyNamespace = namespaceNameOf("urn:toy");

/**
 * The namespaces of four vocabularies, as `#pantry/vocab/namespaces.ts` writes them: the curriculum
 * standards metadata and LOM, which the content-packaging set lists, QTI's own, which it does not,
 * and XML Schema's.
 */
const setNamespaces = {
  asi: "http://www.imsglobal.org/xsd/imsqtiasi_v3p0",
  csmd: "http://www.imsglobal.org/xsd/qti/qtiv3p0/imscsmd_v1p1",
  lom: "http://ltsc.ieee.org/xsd/LOM",
  xs: xsNamespace,
} as const;

describe("XsiType", () => {
  it.effect(
    "holds exactly the types each kind's declared type derives, and only the null type for an anonymous one, every assignment of declared types to 3 kinds",
    (ctx) =>
      searched(
        ctx,
        exhaust(
          {
            box: "every assignment of an anonymous type, the base, a type derived from it and an unrelated type to 3 kinds: 64 assignments",
            caseHang: Duration.minutes(1),
            coverage: requiredInSpace<"anonymous" | "typed">(["anonymous", "typed"]),
            generator: array(element([-1, 0, 1, 2] as const), { max: 3, min: 3 }),
            limit: 200,
            literal: Formatter.format,
            oracle: {
              kind: "specification",
              name: "XML Schema 1.0 Part 1 §3.3.4 clause 4 read over the toy derivations by hand",
            },
            suite: "grammar/xsi/model",
          },
          (declared, c) =>
            Effect.gen(function* model() {
              // Oracle: §3.3.4 clause 4 read over the toy derivations by hand: an element may name
              // its declared type or a type derived from it, and nothing for an anonymous type.
              const kinds = roster("NodeKind", ["k0", "k1", "k2"]);
              const versions = roster("SchemaVersion", schemaVersions);
              const models: readonly (ContentModel & { readonly namespace: NamespaceOfKind })[] =
                declared.map((at, index) => ({
                  content: { _tag: "empty" },
                  kind: `k${String(index)}`,
                  namespace: toyNamespace,
                  sources: toySources(schemaVersions),
                  type: Option.fromNullishOr(types[at]),
                  versions: schemaVersions,
                }));
              c.note(declared.includes(-1) ? "anonymous" : "typed");

              const result = xsiTypesOf({
                derivations,
                kinds,
                models,
                versions,
              });
              assert.isTrue(Result.isSuccess(result));
              if (Result.isSuccess(result)) {
                const anonymousType = indexedSourced(result.success.anonymousType);
                const xsiType = indexedSourced(result.success.xsiType);
                for (const [index, at] of declared.entries()) {
                  for (const version of schemaVersions) {
                    for (const [named, type] of types.entries()) {
                      const expected = at === named || (at === 0 && named === 1);
                      const key = { kind: `k${String(index)}`, type: typeHandle(type), version };
                      assert.strictEqual(Option.isSome(xsiType.lookup(key)), expected);
                      assert.strictEqual(Option.isSome(xsiType.sourceOf(key)), expected);
                    }

                    // An anonymous type stands with no xsi:type and names no type at all.
                    const own = { kind: `k${String(index)}`, version };
                    assert.strictEqual(Option.isSome(anonymousType.lookup(own)), at === -1);
                    assert.strictEqual(Option.isSome(anonymousType.sourceOf(own)), at === -1);
                    assert.deepStrictEqual(
                      result.success.declaredType(version, `k${String(index)}`),
                      Option.map(Option.fromNullishOr(types[at]), typeHandle),
                    );
                  }
                }
              }
            }),
        ),
      ),
  );

  it("names a derived type only where a schema set of its kind's documents holds it", () => {
    // Oracle: XML Schema 1.0 Part 1, §3.3.4 clause 4.1 with spec reading 81's schema sets, by hand:
    // a csmd kind stands only in a manifest, whose set holds csmd's types, LOM's and XML Schema's
    // own, and no ASI type. Bound: one kind, each of the four namespaces' types; residual none.
    const declared: ExpandedName = { local: "GUID.Type", namespace: setNamespaces.csmd };
    const derived = Object.values(setNamespaces).map((namespace) => ({ local: "T", namespace }));
    const kinds = roster("NodeKind", ["csmd:GUID"]);
    const versions = roster("SchemaVersion", schemaVersions);
    const result = xsiTypesOf({
      derivations: [{ derived: [declared, ...derived], type: declared, versions: schemaVersions }],
      kinds,
      models: [
        {
          content: { _tag: "empty" },
          kind: "csmd:GUID",
          namespace: namespaceNameOf(setNamespaces.csmd),
          sources: toySources(schemaVersions),
          type: Option.some(declared),
          versions: schemaVersions,
        },
      ],
      versions,
    });

    assert.deepStrictEqual(
      result.pipe(
        Result.map(({ xsiType }) =>
          [declared, ...derived].map((type) =>
            Option.isSome(
              indexedSourced(xsiType).lookup({
                kind: "csmd:GUID",
                type: typeHandle(type),
                version: "3.0.1",
              }),
            ),
          ),
        ),
      ),
      Result.succeed([true, false, true, true, true]),
    );
  });

  it("refuses a declared type no derivation lists", () => {
    const kinds = roster("NodeKind", ["k0"]);
    const versions = roster("SchemaVersion", schemaVersions);
    const result = xsiTypesOf({
      derivations: [],
      kinds,
      models: [
        {
          content: { _tag: "empty" },
          kind: "k0",
          namespace: toyNamespace,
          sources: toySources(schemaVersions),
          type: Option.some({ local: "Lost", namespace: "urn:toy" }),
          versions: schemaVersions,
        },
      ],
      versions,
    });

    assert.strictEqual(
      Result.isFailure(result) ? result.failure._tag : "generated",
      "UnderivedType",
    );
  });
});

/**
 * Whether every pinned XSD is in the cache; without them the xmllint differential is skipped.
 */
const cached = await Effect.runPromise(
  checkCache().pipe(
    Effect.as(true),
    Effect.catchTag("XsdSourceMissing", () => Effect.succeed(false)),
    Effect.provide(NodeServices.layer),
  ),
);

/**
 * The schema sets the differential walks, each with its version and the target namespace of its
 * type probes.
 */
const typedSchemas: readonly (readonly [SourcePath, SchemaVersion, string])[] = [
  ["imsqti_asiv3p0_v1p0.xsd", "3.0.0", "http://www.imsglobal.org/xsd/imsqtiasi_v3p0"],
  ["imsqti_asiv3p0p1_v1p0.xsd", "3.0.1", "http://www.imsglobal.org/xsd/imsqtiasi_v3p0"],
  [
    "imsqtiv3p0p1_imscpv1p2_v1p0.xsd",
    "3.0.1",
    "http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1",
  ],
];

/**
 * Read a named type's `TypeName` handle back as the name it spells.
 *
 * @param handle - A named type's handle.
 * @returns The name.
 */
const nameOfHandle = (handle: string): ExpandedName =>
  Option.getOrThrowWith(
    expandedNameOf(handle),
    () => new Error(`${handle} spells no named type, so the probe has no name to write.`),
  );

/**
 * A probe of an element's `xsi:type`, with the kind it probes.
 */
type TypeProbe = ProbeDocument & { readonly kind: string };

/**
 * Draw the `xsi:type` probes of one kind: its declared type, the first and last two types the
 * IR's derivations give it, `xs:anyType`, and a named type it does not derive. The candidates come
 * from the IR and the roster at large, never from the relation under test. The probe is the kind's
 * global element, or an element of its named type in the target namespace; a kind with neither,
 * or with several contents, is not probed.
 *
 * @param input - The kind and what probing it reads.
 * @param input.grammar - The composed grammar.
 * @param input.kind - The kind.
 * @param input.readings - Its contents, as the reader walked them.
 * @param input.resolve - The composition's resolution.
 * @param input.set - The schema set.
 * @param input.target - The target namespace of type probes.
 * @param input.version - The version.
 * @returns The probes.
 */
const typeProbesOf = (input: {
  readonly grammar: ComposedGrammar;
  readonly kind: string;
  readonly readings: readonly Content[];
  readonly resolve: (namespace: string, local: string, parent: string) => Option.Option<string>;
  readonly set: XsdSet;
  readonly target: string;
  readonly version: SchemaVersion;
}): readonly TypeProbe[] => {
  const { grammar, kind, resolve, target, version } = input;
  const [reading, ...others] = input.readings;
  const name = Option.getOrUndefined(grammar.kinds.elementName.lookup({ kind }));
  if (reading === undefined || others.length > 0 || name === undefined) {
    return [];
  }

  const declared = grammar.xsi.declaredType(version, kind);
  const global =
    input.set.elements.has(`{${name.namespace}}${name.local}`) &&
    Option.contains(resolve(name.namespace, name.local, "document"), kind);
  const typed = declared.pipe(
    Option.filter(
      (type) =>
        reading.type === nameKey(nameOfHandle(type)) && nameOfHandle(type).namespace === target,
    ),
  );
  if (!global && Option.isNone(typed)) {
    return [];
  }

  const parent: Probe = Option.match(typed, {
    onNone: () => ({ _tag: "global", name }),
    onSome: (type) =>
      global ? { _tag: "global", name } : { _tag: "type", type: nameOfHandle(type) },
  });
  const anyType = typeHandle({ local: "anyType", namespace: xsNamespace });
  const allowed = (
    typeDerivations.find(
      (row) => row.versions.includes(version) && Option.contains(declared, typeHandle(row.type)),
    )?.derived ?? []
  ).map(typeHandle);
  const unrelated = grammar.xsi.typeName.handles.find(
    (handle) => handle !== anyType && !allowed.includes(handle),
  );

  return [
    ...new Set([
      ...allowed.slice(0, 2),
      ...allowed.slice(-2),
      anyType,
      ...Option.toArray(Option.fromNullishOr(unrelated)),
    ]),
  ].map((handle) => ({ children: [], kind, parent, type: Option.some(nameOfHandle(handle)) }));
};

describe.skipIf(!cached)("XsiType against xmllint", () => {
  it.effect(
    "admits an xsi:type on a strictly assessed element exactly when xmllint does: every probed kind, its declared type, the first and last types the IR derives from it, xs:anyType and a type it does not derive",
    (ctx) =>
      // Oracle: libxml2's schema validator over the pinned XSDs, which judges §3.3.4 clause 4 on
      // the probe's own declaration: a global element of the kind, or one of its named type.
      Effect.gen(function* againstXmllint() {
        const grammar = yield* Effect.fromResult(composed());
        const { kinds } = grammar;
        const anonymousType = indexedSourced(grammar.xsi.anonymousType);
        const xsiType = indexedSourced(grammar.xsi.xsiType);
        const failures: string[] = [];
        let probed = 0;
        for (const [root, version, target] of typedSchemas) {
          const { set } = yield* loadXsd(root);
          const resolve = resolverOf(kinds);
          const { contents } = xsdContents(set, resolve);
          const probes = [...contents].flatMap(([kind, readings]) =>
            typeProbesOf({ grammar, kind, readings, resolve, set, target, version }),
          );

          const verdicts = yield* Effect.scoped(validateContents(root, target, probes));
          for (const [index, probe] of probes.entries()) {
            probed += 1;
            const handle = Option.match(probe.type, { onNone: () => "(none)", onSome: typeHandle });
            const admitted = Option.match(probe.type, {
              onNone: () => Option.isSome(anonymousType.lookup({ kind: probe.kind, version })),
              onSome: (type) =>
                Option.isSome(
                  xsiType.lookup({ kind: probe.kind, type: typeHandle(type), version }),
                ),
            });
            const verdict = verdicts[index];
            if (verdict === undefined || verdict.typeRefused === admitted) {
              failures.push(
                `${root} ${probe.kind} xsi:type=${handle}: the grammar ${admitted ? "admits" : "refuses"}, xmllint ${verdict?.typeRefused === true ? "refuses" : "admits"}`,
              );
            }
          }
        }

        yield* Effect.promise(() => ctx.annotate(`${String(probed)} probes`, "xmllint"));
        assert.isAbove(probed, 0);
        assert.deepStrictEqual(failures.slice(0, 30), []);
      }).pipe(Effect.provide(XsdOracleLayer)),
    testTimeoutMs,
  );
});

/**
 * The `xsi:` names an element of a kind admits under a simple governing type, and the four a
 * foreign element admits: XML Schema's instance attributes, `xsi:nil` but on a foreign element,
 * since no pinned element declaration is nillable (XML Schema 1.0 Part 1, §3.3.4, Element Locally
 * Valid (Type), clause 3.1.1; audit A6).
 */
const simpleNames = {
  element: ["xsi:noNamespaceSchemaLocation", "xsi:schemaLocation", "xsi:type"],
  foreign: ["xsi:nil", "xsi:noNamespaceSchemaLocation", "xsi:schemaLocation", "xsi:type"],
} as const;

describe("Governor", () => {
  it.effect(
    "admits exactly the xsi: names under every simple governor, every declaration and the required ones of its type under every complex one, reads each governed element's text in its type's domain, and governs no element by its declared type or by a complex type on a foreign one: every governor of production in both versions",
    () =>
      // Oracle: the leaf's own reading of the pinned XSDs, `typeAttributeDeclarations` and
      // `typeTexts` (whose re-run declarations.test.ts holds byte for byte), against the
      // composition's `Governor`, `GovernedAttribute` and `TypeText`, under XML Schema 1.0 Part 1,
      // §3.3.4, clauses 5.2.1 and 3.1, as spec readings 60 and 84 read them.
      // Bound: every row of `Governor` in production, exhausted.
      Effect.gen(function* governors() {
        const grammar = yield* Effect.fromResult(composed());
        const { attributes } = grammar;
        const leaf = yield* Effect.promise(() => import("#pantry/vocab/inventory/attributes.ts"));
        const disagreements: string[] = [];
        const governed = schemaVersions.flatMap((version) =>
          attributes.governor.rows
            .filter((row) => row.version === version)
            .map(({ governs, kind }) => ({ governs, kind, version })),
        );
        for (const { governs, kind, version } of governed) {
          const names = new Set(
            admittedOf(
              attributes,
              grammar.kinds.attributeName,
              version,
              kind,
              Option.some(governs),
            ).map(({ name }) => name),
          );
          const required = new Set(
            admittedOf(attributes, grammar.kinds.attributeName, version, kind, Option.some(governs))
              .filter(({ use }) => use === "required")
              .map(({ name }) => name),
          );
          const declared = leaf.typeAttributeDeclarations.filter(
            ({ owner, versions }) => owner === governs && versions.includes(version),
          );
          const complex =
            declared.length > 0 ||
            leaf.typeAttributeWildcards.some(
              ({ owner, versions }) => owner === governs && versions.includes(version),
            );
          const where = `${version} ${kind} ${governs}`;
          if (complex) {
            const missing = declared.filter(({ name }) => !names.has(name)).map(({ name }) => name);
            const expected = new Set(
              declared.filter(({ use }) => use === "required").map(({ name }) => name),
            );
            if (missing.length > 0 || names.has("xsi:nil") || isForeignKind(kind)) {
              disagreements.push(`${where}: admits ${[...names].join(" ")}`);
            }

            if (
              required.size !== expected.size ||
              [...expected].some((name) => !required.has(name))
            ) {
              disagreements.push(`${where}: requires ${[...required].join(" ")}`);
            }
          } else {
            const expected = isForeignKind(kind) ? simpleNames.foreign : simpleNames.element;
            if ([...names].toSorted().join(" ") !== expected.join(" ")) {
              disagreements.push(`${where}: admits ${[...names].join(" ")}`);
            }
          }

          const text = leaf.typeTexts.find(
            ({ owner, versions }) => owner === governs && versions.includes(version),
          );
          const read = textDomainOf(attributes, { governs: Option.some(governs), kind, version });
          // An empty domain, xs:NOTATION's, has no compiled pattern and is a domain all the same.
          const domain = read.pipe(
            Option.flatMap((handle) =>
              attributes.emptyDomains.includes(handle)
                ? Option.some(handle)
                : Option.fromNullishOr(
                    attributes.domains.find((held) => held.handle === handle)?.handle,
                  ),
            ),
          );
          if (
            Option.isSome(read) !== (text !== undefined) ||
            (Option.isSome(read) && Option.isNone(domain))
          ) {
            disagreements.push(`${where}: text ${Formatter.format(read)}`);
          }

          if (Option.contains(grammar.xsi.declaredType(version, kind), governs)) {
            disagreements.push(`${where}: governs by its declared type`);
          }
        }

        for (const version of schemaVersions) {
          for (const kind of Object.values(foreignKinds)) {
            const anyType = typeHandle({ local: "anyType", namespace: xsNamespace });
            if (
              Option.isSome(
                governorOf(attributes, { governs: Option.some(anyType), kind, version }),
              )
            ) {
              disagreements.push(`${version} ${kind}: governed by xs:anyType`);
            }
          }
        }

        assert.isAbove(attributes.governor.rows.length, 0);
        assert.deepStrictEqual(disagreements, []);
      }),
    testTimeoutMs,
  );
});

describe("the TypeName spelling", () => {
  it.effect(
    "spells every pinned type by a prefix table that is a bijection over the pinned namespaces, reads every handle back, and keeps every handle within a PostgreSQL name",
    (ctx) =>
      // Oracle: the specification turned into a checker: an expanded name {namespace}local is
      // read back from its handle (a round trip), the table's prefixes are distinct and each is
      // empty or ends at its only `:`, and grizzle's handle limit, 63 UTF-8 bytes (README, "Tables
      // and types").
      // Bound: every type the pinned XSDs' derivations name, and every TypeName handle of
      // production, exhausted.
      Effect.gen(function* everyType() {
        const grammar = yield* Effect.fromResult(composed());
        const names = [
          ...new Map(
            typeDerivations
              .flatMap(({ derived, type }) => [type, ...derived])
              .map((name) => [`{${name.namespace}}${name.local}`, name] as const),
          ).values(),
        ];
        const prefixes = [...typePrefixes.values()];

        assert.strictEqual(new Set(prefixes).size, prefixes.length);
        assert.isTrue(
          prefixes.every(
            (prefix) =>
              prefix === "" || (prefix.endsWith(":") && prefix.indexOf(":") === prefix.length - 1),
          ),
        );
        assert.deepStrictEqual(
          new Set(names.map(({ namespace }) => namespace)).difference(new Set(typePrefixes.keys())),
          new Set(),
        );

        yield* searched(
          ctx,
          exhaust(
            {
              box: `every type the pinned derivations name, ${names.length}`,
              caseHang: Duration.minutes(1),
              coverage: requiredInSpace<"built-in" | "prefixed" | "unprefixed">([
                "built-in",
                "prefixed",
                "unprefixed",
              ]),
              generator: int(0, names.length - 1),
              limit: names.length,
              literal: Formatter.format,
              oracle: { kind: "universal", name: "expandedNameOf ∘ typeHandle = id" },
              suite: "grammar/xsi/type-handles",
            },
            (index, c) =>
              Effect.sync(() => {
                const name = Arr.getUnsafe(names, index);
                const handle = typeHandle(name);
                if (name.namespace === xsNamespace) {
                  c.note("built-in");
                } else {
                  c.note(handle.includes(":") ? "prefixed" : "unprefixed");
                }

                assert.deepStrictEqual(expandedNameOf(handle), Option.some(name));
                assert.isAtMost(new TextEncoder().encode(handle).length, 63, handle);
              }),
          ),
        );

        for (const handle of grammar.xsi.typeName.handles) {
          assert.deepStrictEqual(
            Option.map(expandedNameOf(handle), typeHandle),
            Option.some(handle),
          );
        }
      }),
    testTimeoutMs,
  );
});

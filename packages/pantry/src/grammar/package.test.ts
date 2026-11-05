import { NodeServices } from "@effect/platform-node";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import type { Element } from "@qti-pie/crust/tree.ts";
import { fin, roster } from "#pantry/grammar/closed.ts";
import { cp, documentRoots, lom, manifestRoot, asi, ud } from "#pantry/grammar/facets.ts";
import { schemaVersions } from "#pantry/grammar/kinds.ts";
import { packageGrammar } from "#pantry/grammar/package.ts";
import { checkCache } from "#pantry/vocab/derive/sources.ts";
import { loadXsd, XsdOracleLayer } from "#pantry/test/gen/grammar.ts";

/**
 * Whether every pinned XSD is in the cache; without them the XSD read is skipped.
 */
const cached = await Effect.runPromise(
  checkCache().pipe(
    Effect.as(true),
    Effect.catchTag("XsdSourceMissing", () => Effect.succeed(false)),
    Effect.provide(NodeServices.layer),
  ),
);

/**
 * The package relations of production's facets, over a roster of the kinds their roots name.
 */
const relations = Effect.gen(function* packageRelations() {
  const versions = yield* Effect.fromResult(roster("SchemaVersion", schemaVersions));
  const kinds = yield* Effect.fromResult(roster("NodeKind", [...documentRoots]));

  return yield* Effect.fromResult(
    packageGrammar({
      facets: [asi, cp, lom, ud].map(({ package: stated }) => stated),
      kinds,
      versions,
    }),
  );
});

/**
 * Collect the enumeration values of a type's `type` attribute in a schema node's subtree, following
 * a named simple type into the set's types: XML Schema Part 2's enumeration facet, read from the
 * XSD itself.
 *
 * @param node - The node.
 * @param named - Resolve a simple type's local name to its node.
 * @param inside - Whether the walk is inside the `type` attribute's declaration.
 * @returns The values.
 */
const enumerationOf = (
  node: Element,
  named: (local: string) => Option.Option<Element>,
  inside: boolean,
): readonly string[] =>
  node.children.flatMap((child): readonly string[] => {
    if (child.kind !== "element") {
      return [];
    }

    const name = child.attributes.find((held) => held.local === "name")?.value;
    const typeOf = child.attributes.find((held) => held.local === "type")?.value;
    const entering = child.local === "attribute" && name === "type";
    if (inside && child.local === "enumeration") {
      return Option.toArray(
        Option.fromNullishOr(child.attributes.find((held) => held.local === "value")?.value),
      );
    }

    const viaType =
      entering && typeOf !== undefined
        ? Option.match(named(typeOf.slice(typeOf.indexOf(":") + 1)), {
            onNone: () => [],
            onSome: (found) => enumerationOf(found, named, true),
          })
        : [];

    return [...viaType, ...enumerationOf(child, named, inside || entering)];
  });

describe.skipIf(!cached)("ResourceTypeOf against the content-packaging XSDs", () => {
  it.effect(
    "holds exactly the (version, type) pairs each version's resource type's @type enumerates",
    () =>
      Effect.gen(function* resourceTypes() {
        const { resourceTypeOf } = yield* relations;
        const target = "http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1";
        for (const [root, version] of [
          ["imsqtiv3p0_imscpv1p2_v1p0.xsd", "3.0.0"],
          ["imsqtiv3p0p1_imscpv1p2_v1p0.xsd", "3.0.1"],
        ] as const) {
          const { set } = yield* loadXsd(root);
          // The 3.0.0 XSD names the type `Resource.Type`, the 3.0.1 XSD `ResourceDType`.
          const resource =
            set.types.get(`{${target}}Resource.Type`) ?? set.types.get(`{${target}}ResourceDType`);
          const named = (local: string) =>
            Option.map(
              Option.fromNullishOr(set.types.get(`{${target}}${local}`)),
              ({ node }) => node,
            );
          const enumerated =
            resource === undefined ? [] : enumerationOf(resource.node, named, false);

          assert.isAbove(enumerated.length, 0, root);
          assert.deepStrictEqual(
            new Set(
              resourceTypeOf.rows.filter((row) => row.version === version).map(({ type }) => type),
            ),
            new Set(enumerated),
            version,
          );
        }
      }).pipe(Effect.provide(XsdOracleLayer)),
    120_000,
  );
});

describe("RootOfType", () => {
  it.effect(
    "is a function into the document roots, and the roots are the manifest's and its payload's",
    () =>
      Effect.gen(function* roots() {
        const { rootOfType } = yield* relations;
        const types = rootOfType.rows.map(({ type }) => type);

        assert.strictEqual(new Set(types).size, types.length);
        assert.deepStrictEqual(
          new Set(documentRoots),
          new Set([manifestRoot, ...rootOfType.rows.map(({ root }) => root)]),
        );
      }),
  );

  it("refuses a root kind the composition's roster does not hold", () => {
    const result = Result.flatMap(roster("SchemaVersion", schemaVersions), (versions) =>
      packageGrammar({ facets: [asi.package, cp.package], kinds: fin("NodeKind", 1), versions }),
    );

    assert.strictEqual(
      Result.isFailure(result) ? result.failure._tag : "generated",
      "OutsideCodeSpace",
    );
  });
});

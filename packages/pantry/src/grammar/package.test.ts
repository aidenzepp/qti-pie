import { NodeServices } from "@effect/platform-node";
import { assert, describe, it } from "@effect/vitest";
import { Effect, FileSystem, Formatter, Option, Result } from "effect";
import type { Element } from "@qti-pie/crust/tree.ts";
import { admissionOf } from "#pantry/grammar/attributes.ts";
import type { ValueDomain } from "#pantry/grammar/attributes.ts";
import { roster } from "#pantry/grammar/closed.ts";
import { composed } from "#pantry/grammar/compose.ts";
import { patternFlags } from "#pantry/grammar/domains.ts";
import {
  cp,
  documentRoots,
  fragmentRoots,
  lom,
  manifestRoot,
  asi,
  ud,
  xi,
} from "#pantry/grammar/facets.ts";
import { schemaVersions } from "#pantry/grammar/kinds.ts";
import type { SchemaVersion } from "#pantry/grammar/kinds.ts";
import { packageGrammar } from "#pantry/grammar/package.ts";
import { noType } from "#pantry/grammar/xsi.ts";
import { checkCache, xsdDirectory } from "#pantry/vocab/derive/sources.ts";
import { loadXsd, XsdOracleLayer } from "#pantry/test/gen/grammar.ts";
import { scratchDirectory } from "#pantry/test/scratch.ts";
import { writeXsdOracle } from "#pantry/test/xsd-catalog.ts";
import { OracleLayer, xmllintValidate } from "#pantry/xml/oracle.ts";

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
  const kinds = yield* Effect.fromResult(roster("NodeKind", [...documentRoots]));

  return yield* Effect.fromResult(
    packageGrammar({
      facets: [asi, cp, lom, ud, xi].map(({ package: stated }) => stated),
      kinds,
    }),
  );
});

/**
 * The composed grammar, whose attribute grammar states which resource types each version admits:
 * the value domain of `cp:resource`'s `type` (spec reading 67).
 */
const grammar = Result.getOrThrow(composed());

/**
 * Read the value domain a version reads `cp:resource`'s `type` under, its declared type governing.
 *
 * @param version - The version.
 * @returns The domain.
 */
const resourceTypeDomain = (version: SchemaVersion): ValueDomain =>
  Option.getOrThrowWith(
    Option.flatMap(
      admissionOf(grammar.attributes, {
        governs: noType,
        kind: "cp:resource",
        name: "type",
        version,
      }),
      ({ domain }) =>
        Option.fromNullishOr(grammar.attributes.domains.find(({ handle }) => handle === domain)),
    ),
    () => new Error(`cp:resource admits no type in ${version}`),
  );

/**
 * Whether a version's value domain of `cp:resource`'s `type` admits a lexical form as written.
 *
 * @param version - The version.
 * @param type - The form.
 * @returns Whether its pattern matches.
 */
const admits = (version: SchemaVersion, type: string): boolean =>
  new RegExp(resourceTypeDomain(version).pattern, patternFlags).test(type);

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

describe.skipIf(!cached)("cp:resource's type against the content-packaging XSDs", () => {
  it.effect(
    "admits, in each version, exactly the types its content-packaging XSD enumerates, and keeps them as its enumeration: the one statement of spec reading 67",
    () =>
      // Oracle: each version's XSD, its resource type's `type` enumeration read from the XSD itself.
      // Bound: every type either version enumerates, the guide's own spelling of the response
      // processing type, and three strangers to each (case, outer space, an empty form), in both
      // versions. Spec reading 67 was stated twice, by this domain and by a ResourceTypeOf relation
      // of (version, type) rows read from the same enumeration; the relation and its law are gone,
      // and this domain refuses exactly what the two refused: a form outside its version's list.
      Effect.gen(function* resourceTypes() {
        const enumeratedOf = new Map<string, readonly string[]>();
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
            new Set(resourceTypeDomain(version).enumeration),
            new Set(enumerated),
            version,
          );
          enumeratedOf.set(version, enumerated);
        }

        const every = [...new Set([...enumeratedOf.values()].flat())];
        const strangers = every.flatMap((type) => [type.toUpperCase(), ` ${type}`, `${type} `]);
        for (const version of schemaVersions) {
          const enumerated = new Set(enumeratedOf.get(version));
          for (const type of [...every, ...strangers, "imsqti_responseprocessing_xmlv3p0", ""]) {
            assert.strictEqual(
              admits(version, type),
              enumerated.has(type),
              `${version} ${JSON.stringify(type)}`,
            );
          }
        }
      }).pipe(Effect.provide(XsdOracleLayer)),
    120_000,
  );
});

/**
 * The resource types whose files are documents the composition reads, each with the root element
 * its file holds, read off the QTI 3.0 Best Practice and Implementation Guide independently of the
 * facets: §6.2's table of resource types, whose descriptions name the class each file holds ("QTI 3
 * AssessmentTest", ...); §6.3's external metadata file, whose example's root is LOM's `lom`; and
 * §6.5's usage-data file, whose root is `usageData`. The guide's table spells the response
 * processing type `imsqti_responseprocessing_xmlv3p0`; the content-packaging XSDs, whose
 * enumeration the type's value domain is, enumerate `imsqti_resprocessing_xmlv3p0`, so it is
 * written as the XSD spells it (spec reading 82). The table's other types (a fragment, web content,
 * LTI links, PLS lexicons, control files, non-IMS metadata, stylesheets) are no document of the
 * composition, but the fragment, an included document read in place (spec reading 114).
 */
const statedRoots: readonly { readonly root: string; readonly type: string }[] = [
  { root: "qti-assessment-test", type: "imsqti_test_xmlv3p0" },
  { root: "qti-assessment-section", type: "imsqti_section_xmlv3p0" },
  { root: "qti-assessment-item", type: "imsqti_item_xmlv3p0" },
  { root: "qti-outcome-declaration", type: "imsqti_outcomes_xmlv3p0" },
  { root: "qti-response-processing", type: "imsqti_resprocessing_xmlv3p0" },
  { root: "qti-assessment-stimulus", type: "imsqti_stimulus_xmlv3p0" },
  { root: "qti-response-processing", type: "imsqti_rptemplate_xmlv3p0" },
  { root: "lom:lom", type: "resourcemetadata/xml" },
  { root: "ud:usageData", type: "qtiusagedata/xml" },
];

/**
 * The manifest's root, which no resource type lists: the guide's §6.1.1, a package's
 * `imsmanifest.xml`, whose root is content packaging's `manifest`.
 */
const statedManifest = "cp:manifest";

/**
 * Write a (type, root) pair as one comparable string.
 *
 * @param row - The pair.
 * @param row.root - The root kind.
 * @param row.type - The resource type.
 * @returns The two, space-separated.
 */
const pair = ({ root, type }: { readonly root: string; readonly type: string }): string =>
  `${type} ${root}`;

describe("RootOfType", () => {
  it.effect(
    "holds exactly the (type, root) pairs the implementation guide states, and the document roots are the manifest's and theirs",
    () =>
      // Oracle: the specification as a checker, the guide's resource types and their files' roots,
      // stated above, and the guide's `imsqti_fragment_xmlv3p0`, "QTI 3 inclusion (XInclude)", whose
      // document's root is any kind an include stands for (spec reading 114), the rows
      // `include.test.ts` proves against each parent's automaton. Set equality, so a pair dropped,
      // added or re-rooted fails, as does a document root no stated file holds.
      Effect.gen(function* roots() {
        const { rootOfType } = yield* relations;
        const fragments = fragmentRoots.map(({ root }) => ({
          root,
          type: "imsqti_fragment_xmlv3p0",
        }));

        assert.deepStrictEqual(
          new Set(rootOfType.rows.map(pair)),
          new Set([...statedRoots, ...fragments].map(pair)),
        );
        assert.strictEqual(manifestRoot, statedManifest);
        assert.deepStrictEqual(
          new Set(documentRoots),
          new Set([statedManifest, ...[...statedRoots, ...fragments].map(({ root }) => root)]),
        );
      }),
  );
});

/**
 * The resource types of the implementation guide's §6.2 table, as the guide spells them, read off
 * `impl.txt` lines 13275 to 13355, and the content-packaging XSDs' spelling of the one the guide
 * spells otherwise, `imsqti_resprocessing_xmlv3p0` (spec reading 82).
 */
const guideTypes = [
  "imsqti_test_xmlv3p0",
  "imsqti_section_xmlv3p0",
  "imsqti_item_xmlv3p0",
  "imsqti_outcomes_xmlv3p0",
  "imsqti_responseprocessing_xmlv3p0",
  "imsqti_resprocessing_xmlv3p0",
  "imsqti_stimulus_xmlv3p0",
  "imsqti_fragment_xmlv3p0",
  "imsqti_rptemplate_xmlv3p0",
  "associatedcontent/learning-application-resource",
  "webcontent",
  "imslti_xmlv1p1",
  "imsltia_xmlv1p0",
  "controlfile",
  "resourcemetadata/xml",
  "resourceextmetadata/xml",
  "qtiusagedata/xml",
  "pls",
  "css2",
  "css3",
  "extension",
] as const;

/**
 * A manifest of a version whose one resource has a type, and nothing else the content-packaging
 * XSD does not require.
 *
 * @param version - The version, which its `schemaversion` names.
 * @param type - The resource's type, as written.
 * @returns The manifest's text.
 */
const manifestOfType = (version: string, type: string): string =>
  `<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" identifier="M"><metadata><schema>QTI Package</schema><schemaversion>${version}</schemaversion></metadata><organizations/><resources><resource identifier="R" type="${type}" href="a.xml"><file href="a.xml"/></resource></resources></manifest>\n`;

describe.skipIf(!cached)("cp:resource's type against xmllint", () => {
  it.effect(
    "its value domain admits each type of the guide's table, and the XSD's imsqti_resprocessing_xmlv3p0, in a version exactly when xmllint accepts a manifest whose resource carries it: every type in both versions",
    () =>
      // Oracle: libxml2 over each version's content-packaging XSD, the normative source of the
      // vocabulary (spec reading 82): the guide is informative, so a spelling only it gives, such as
      // `imsqti_responseprocessing_xmlv3p0`, is refused where the XSD refuses it.
      // Bound: the guide's 20 types and the XSD's spelling of the 21st, in both versions, 42
      // manifests.
      Effect.gen(function* againstXmllint() {
        const fs = yield* FileSystem.FileSystem;
        const directory = yield* scratchDirectory("resource-types-");
        const oracle = yield* writeXsdOracle(directory);
        const cache = yield* xsdDirectory;
        const disagreements: string[] = [];
        for (const [root, version] of [
          ["imsqtiv3p0_imscpv1p2_v1p0.xsd", "3.0.0"],
          ["imsqtiv3p0p1_imscpv1p2_v1p0.xsd", "3.0.1"],
        ] as const) {
          const files = guideTypes.map(
            (type) => `${directory}/${version}-${type.replaceAll("/", "-")}.xml`,
          );
          for (const [at, type] of guideTypes.entries()) {
            yield* fs.writeFileString(files[at] ?? "", manifestOfType(version, type));
          }

          const verdicts = yield* xmllintValidate({
            catalog: oracle.catalog,
            paths: files,
            schema: `${cache}/${root}`,
          });
          for (const [at, type] of guideTypes.entries()) {
            const valid = verdicts[at]?._tag === "Valid";
            const admitted = admits(version, type);
            if (valid !== admitted) {
              disagreements.push(
                `${version} ${type}: the value domain ${admitted ? "admits" : "refuses"} it, xmllint ${valid ? "accepts" : "refuses"} ${Formatter.format(verdicts[at])}`,
              );
            }
          }
        }

        assert.isFalse(admits("3.0.1", "imsqti_responseprocessing_xmlv3p0"));
        assert.deepStrictEqual(disagreements, []);
      }).pipe(Effect.scoped, Effect.provide(OracleLayer), Effect.provide(XsdOracleLayer)),
    120_000,
  );
});

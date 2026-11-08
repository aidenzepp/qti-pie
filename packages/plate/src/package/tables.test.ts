import { assert, describe, it } from "@effect/vitest";
import { ConfigProvider, Effect } from "effect";
import { xmlNamespace } from "#plate/document/source.ts";
import { packageOccurrences, packageTables } from "#plate/package/tables.ts";
import { cachedXsds, isXsdPath, linkedHome, xsdPaths } from "#plate/test/xsd-layout.ts";
import type { XsdPath } from "#plate/test/xsd-layout.ts";
import type { ChildOccurrence, Tables } from "#plate/validate/xsd.ts";
import type { NamespaceTables, PackageGeneration } from "#scripts/package-tables.ts";
import { cacheDirectory, generatePackageTables } from "#scripts/package-tables.ts";

/**
 * The two CP profiles' closure: every XSD the generator reads, transitively, by path under the XSD
 * cache, in the order the generator lists them.
 */
const closure: readonly XsdPath[] = [
  "cpext/imsqtiv3p0_cpextv1p2_v1p0.xsd",
  "cpext/imsqtiv3p0p1_cpextv1p2_v1p0.xsd",
  "csm/imsqtiv3p0_csmv1p1_v1p0.xsd",
  "csm/imsqtiv3p0p1_csmv1p1_v1p0.xsd",
  "drd/imsqtiv3p0_afa3p0drd_v1p0.xsd",
  "drd/imsqtiv3p0p1_afa3p0drd_v1p0.xsd",
  "imsqti_metadatav3p0_v1p0.xsd",
  "imsqtiv3p0_imscpv1p2_v1p0.xsd",
  "imsqtiv3p0p1_imscpv1p2_v1p0.xsd",
  "lom/imsmd_loose_v1p3p2.xsd",
  "w3/xml.xsd",
  "xlink/xlink.xsd",
];

/**
 * The SHA-256 of every file of the {@link closure}, in its order, as `src/test/xsd-layout.ts` pins
 * it. A file the generator reads must be one of these, with this hash.
 */
const xsdHashes: ReadonlyMap<string, string> = new Map(
  closure.map((file) => [file, cachedXsds[file].sha256] as const),
);

/**
 * The Results XSD, which the oracle reads and the package tables do not. `fetch-xsds` does not
 * fetch it, so a home in that layout alone lacks it.
 */
const resultsXsd = "imsqti_resultv3p0_v1p0.xsd";

/**
 * The namespace of a QTI 3 package's manifest, under both CP profiles.
 */
const cpNamespace = "http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1";

/**
 * XLink's namespace, which the CP extensions import and nothing in the closure references.
 */
const xlinkNamespace = "http://www.w3.org/1999/xlink";

/**
 * The namespaces each profile's tables reach: the manifest's, the CP extension's and the
 * accessibility schema it names, curriculum standards, QTI metadata, LOM, and XML's for the
 * attributes it declares.
 */
const reachedNamespaces: readonly string[] = [
  "http://ltsc.ieee.org/xsd/LOM",
  "http://www.imsglobal.org/xsd/imsqti_metadata_v3p0",
  "http://www.imsglobal.org/xsd/qti/qtiv3p0/imsafa3p0drd_v1p0",
  "http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_extensionv1p2",
  cpNamespace,
  "http://www.imsglobal.org/xsd/qti/qtiv3p0/imscsmd_v1p1",
  xmlNamespace,
];

/**
 * The name of the manifest metadata's type under each CP version, which the 3.0.1 profile
 * renamed; its keys are the versions the tables cover.
 */
const manifestMetadataTypes: ReadonlyMap<string, string> = new Map([
  ["3.0.0", "ManifestMetadata.Type"],
  ["3.0.1", "ManifestMetadataDType"],
]);

/**
 * Reading both profiles' closures and generating their tables nears vitest's 5 s default under
 * load.
 */
const regenerateTimeoutMs = 60_000;

/**
 * The generator's run over the cached XSDs, once for the file.
 */
const generated = Effect.runSync(Effect.cached(generatePackageTables));

/**
 * Take one part of every namespace's tables in a generation, keyed as the committed maps are.
 *
 * @param generation The generation.
 * @param part Which part, the tables or the occurrences.
 * @returns Per CP version, that part of each namespace's tables.
 */
const partOf = <Part extends "occurrences" | "tables">(
  generation: PackageGeneration,
  part: Part,
): ReadonlyMap<string, ReadonlyMap<string, NamespaceTables[Part]>> =>
  new Map(
    [...generation.versions].map(([version, namespaces]) => [
      version,
      new Map([...namespaces].map(([namespace, tabled]) => [namespace, tabled[part]])),
    ]),
  );

/**
 * The committed tables of one namespace under one CP version.
 *
 * @param version The CP version.
 * @param namespace The namespace URI.
 * @returns Its tables; the test fails when there are none.
 */
const tablesOf = (version: string, namespace: string): Tables => {
  const tables = packageTables.get(version)?.get(namespace);
  assert.isDefined(tables, `CP ${version} has tables for ${namespace}`);

  return tables;
};

/**
 * The committed counts of one child under one element or type of the manifest's namespace.
 *
 * @param version The CP version.
 * @param holder Whether the child's holder is an element or a named type.
 * @param name The holder's local name.
 * @param child The child's local name, in the manifest's namespace.
 * @returns Its counts; the test fails when there are none.
 */
const countsOf = (
  version: string,
  holder: "elements" | "types",
  name: string,
  child: string,
): ChildOccurrence => {
  const occurrences = packageOccurrences.get(version)?.get(cpNamespace);
  const counts = occurrences?.[holder][name]?.find(
    (occurrence) => occurrence.namespace === cpNamespace && occurrence.local === child,
  );
  assert.isDefined(counts, `CP ${version} counts ${child} in ${name}`);

  return counts;
};

/**
 * The resource types one CP version's manifest admits: the values its `resource` table's `type`
 * enumerates.
 *
 * @param version The CP version.
 * @returns The types; the test fails when `type` is not an enumeration.
 */
const resourceTypesOf = (version: string): readonly string[] => {
  const type = tablesOf(version, cpNamespace).elements["resource"]?.attributes.find(
    (attribute) => attribute.namespace === "" && attribute.local === "type",
  )?.type;
  assert.strictEqual(type?.kind, "enumeration", `CP ${version} enumerates resource types`);

  return type?.kind === "enumeration" ? type.values : [];
};

describe("package/tables.ts", () => {
  it.effect(
    "the committed tables are what the generator builds from the cached profiles",
    () =>
      Effect.gen(function* regenerateNoDiff() {
        const generation = yield* generated;

        assert.deepStrictEqual(packageTables, partOf(generation, "tables"));
        assert.deepStrictEqual(packageOccurrences, partOf(generation, "occurrences"));
      }),
    { tags: ["qti-xsd"], timeout: regenerateTimeoutMs },
  );

  it.effect(
    "every XSD the generator reads is one of the listed XSDs, with its SHA-256",
    () =>
      Effect.gen(function* readHashes() {
        const { read } = yield* generated;

        for (const [path, sha256] of read) {
          assert.isTrue(xsdHashes.has(path), `${path} is read but is not listed in xsdHashes`);
          assert.strictEqual(sha256, xsdHashes.get(path), `the SHA-256 of ${path}`);
        }
      }),
    { tags: ["qti-xsd"], timeout: regenerateTimeoutMs },
  );

  it.effect(
    "the generator reads exactly the two CP profiles' closure, xlink's file included",
    () =>
      Effect.gen(function* readClosure() {
        const { read } = yield* generated;

        assert.deepStrictEqual([...read.keys()], [...xsdHashes.keys()]);
      }),
    { tags: ["qti-xsd"], timeout: regenerateTimeoutMs },
  );

  it.effect(
    "under the fetch-xsds layout, the generator reads exactly the two CP profiles' closure, every path a table path",
    () =>
      Effect.gen(function* fetchXsdsLayout() {
        const cache = yield* cacheDirectory;
        const home = yield* linkedHome(
          cache,
          xsdPaths.filter((file) => file !== resultsXsd),
        );
        const { read } = yield* generatePackageTables.pipe(
          Effect.provide(ConfigProvider.layer(ConfigProvider.fromUnknown({ HOME: home }))),
        );

        assert.deepStrictEqual([...read.keys()], [...xsdHashes.keys()]);
        for (const [file, sha256] of read) {
          assert.isTrue(
            isXsdPath(file),
            `${file} is read but src/test/xsd-layout.ts lists no such path`,
          );

          if (isXsdPath(file)) {
            assert.strictEqual(sha256, cachedXsds[file].sha256, `the SHA-256 of ${file}`);
          }
        }
      }),
    { tags: ["qti-xsd"], timeout: regenerateTimeoutMs },
  );

  it("each CP version tables exactly the namespaces its profile reaches, none of them xlink's", () => {
    assert.deepStrictEqual([...packageTables.keys()], [...manifestMetadataTypes.keys()]);
    for (const [version, namespaces] of packageTables) {
      assert.deepStrictEqual(
        [...namespaces.keys()].toSorted(),
        [...reachedNamespaces].toSorted(),
        version,
      );
      assert.isFalse(namespaces.has(xlinkNamespace), version);
      assert.deepStrictEqual(
        [...(packageOccurrences.get(version)?.keys() ?? [])],
        [...namespaces.keys()],
        version,
      );
    }
  });

  it("the 3.0.0 resource types lack imslti_xmlv1p1, which 3.0.1 adds", () => {
    assert.notInclude(resourceTypesOf("3.0.0"), "imslti_xmlv1p1");
    assert.include(resourceTypesOf("3.0.1"), "imslti_xmlv1p1");
  });

  it("the manifest's metadata has minOccurs 1", () => {
    for (const version of manifestMetadataTypes.keys()) {
      const metadata = countsOf(version, "elements", "manifest", "metadata");

      assert.strictEqual(metadata.minOccurs, "1", version);
      assert.strictEqual(metadata.maxOccurs, "1", version);
    }
  });

  it("the manifest metadata's schemaversion is required", () => {
    for (const [version, type] of manifestMetadataTypes) {
      const schemaversion = countsOf(version, "types", type, "schemaversion");

      assert.strictEqual(schemaversion.minOccurs, "1", version);
      assert.strictEqual(schemaversion.maxOccurs, "1", version);
    }
  });
});

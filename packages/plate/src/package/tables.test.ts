import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { xmlNamespace } from "#plate/document/source.ts";
import { packageOccurrences, packageTables } from "#plate/package/tables.ts";
import type { ChildOccurrence, Tables } from "#plate/validate/xsd.ts";
import type { NamespaceTables, PackageGeneration } from "#scripts/package-tables.ts";
import { generatePackageTables } from "#scripts/package-tables.ts";

/**
 * The SHA-256 of every XSD the package tables and the Results oracle read, by path under the
 * cache folder: the two CP profiles, everything they import, transitively, and the Results XSD.
 * A file the generator reads must be one of these, with this hash.
 */
const xsdHashes: ReadonlyMap<string, string> = new Map([
  [
    "imsqti_metadatav3p0_v1p0.xsd",
    "448c18d65607695d2a60ce96c42003df98f28630fb044ca14ccc609bad384c8b",
  ],
  [
    "imsqti_resultv3p0_v1p0.xsd",
    "8cf1d3c89cbb1f198691410598ac4f8755a3b3ee6c1459747c3548fa6ccdc509",
  ],
  [
    "imsqtiv3p0_afa3p0drd_v1p0.xsd",
    "dd3822a3fe0f42af9a25b33be56d11d1a1f3c54ea791bcc355965ceb8f41b064",
  ],
  [
    "imsqtiv3p0_cpextv1p2_v1p0.xsd",
    "3f8deb01dd5ac3ad4b81522e159650c01b3dfe199cae6a6be7e87487e790ad85",
  ],
  [
    "imsqtiv3p0_csmv1p1_v1p0.xsd",
    "caa7ddf900afa66fd5efb212a8834b42480f675de092ae927ce0c95b74443d2e",
  ],
  [
    "imsqtiv3p0_imscpv1p2_v1p0.xsd",
    "30be3dad4fe0ee103295268317ee0ff2b1826b8b55023db974a993edf3ce9101",
  ],
  [
    "imsqtiv3p0p1_afa3p0drd_v1p0.xsd",
    "5057bc38307c4a182cf6b2ccc1297474f6001470d7d4342567eab59b19ed2906",
  ],
  [
    "imsqtiv3p0p1_cpextv1p2_v1p0.xsd",
    "e2f7511da9d99152a88e255cc89ea7f65150a3ab0232c6d69aa4c2194245866f",
  ],
  [
    "imsqtiv3p0p1_csmv1p1_v1p0.xsd",
    "2d7d76a165a13065f9c3b3e5fa63ae0a6c31132ac32f1c1402a5f34f59c26f98",
  ],
  [
    "imsqtiv3p0p1_imscpv1p2_v1p0.xsd",
    "cc59960859c6c84b85b9a8611cca8b6149c8758976fce21f3d346fc3acbd4a90",
  ],
  ["md/imsmd_loose_v1p3p2.xsd", "1ae9e77aba63b6789574631213c97fd00a3d43aeffb58050ac7befb665fba9f6"],
  ["w3/xlink.xsd", "e49074eafa608cbf3bc01c2de3406781d466f6ae6adbb90f26cc450d5bf02a1c"],
  ["w3/xml.xsd", "4c637d0381d988dbf24b680becde6e1c8301b4c4ceef8bfa45a1ee130e77a682"],
]);

/**
 * The Results XSD, which the oracle reads and the package tables do not.
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
    regenerateTimeoutMs,
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
    regenerateTimeoutMs,
  );

  it.effect(
    "the generator reads exactly the two CP profiles' closure, xlink's file included",
    () =>
      Effect.gen(function* readClosure() {
        const { read } = yield* generated;

        assert.deepStrictEqual(
          [...read.keys()],
          [...xsdHashes.keys()].filter((path) => path !== resultsXsd),
        );
      }),
    regenerateTimeoutMs,
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

import { readFile } from "node:fs/promises";
import nodePath from "node:path";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import type { Array as Arr } from "effect";
import { readCorpusFile } from "#plate/document/corpus.ts";
import { readSource } from "#plate/document/read.ts";
import { walk } from "#plate/document/source.ts";
import type { SourceElement } from "#plate/document/source.ts";
import { lomCaps, ManifestDefect, readManifest, resourceLom } from "#plate/package/manifest.ts";
import type { LomValues, Manifest, ManifestResource } from "#plate/package/manifest.ts";
import { xsdDirectory } from "#plate/test/xsd.ts";
import type { XsdPath } from "#plate/test/xsd-layout.ts";
import type { Refusal, RefusalRule } from "#plate/validate/refusal.ts";
import { manifestNamespace } from "#plate/vocabulary.ts";

/**
 * A manifest's reading: the manifest, or every refusal of it.
 */
type Reading = Result.Result<Manifest, Arr.NonEmptyReadonlyArray<Refusal>>;

/**
 * The plain IMS Content Packaging namespace, a QTI 2 package's manifest's.
 */
const imsCpNamespace = "http://www.imsglobal.org/xsd/imscp_v1p1";

/**
 * The path step of an element in the manifest's namespace, as a refusal's location spells it.
 */
const cp = `{${manifestNamespace}}`;

/**
 * The path step of an element in LOM's namespace, as a location spells it.
 */
const lom = "{http://ltsc.ieee.org/xsd/LOM}";

/**
 * The location every hand-built manifest in these tests carries.
 */
const location = "imsmanifest.xml";

/**
 * Read a manifest of the example corpus, named by its path under the corpus root.
 *
 * @param path The manifest's path under the corpus root, which every refusal carries.
 * @returns Its reading.
 */
const readCorpusManifest = (path: string) =>
  readCorpusFile(path).pipe(
    Effect.flatMap((bytes) => readSource(path, bytes)),
    Effect.map(readManifest),
  );

/**
 * Read a hand-built manifest.
 *
 * @param xml The manifest's text.
 * @returns Its reading.
 */
const readXml = (xml: string) =>
  readSource(location, new TextEncoder().encode(xml)).pipe(Effect.map(readManifest));

/**
 * Write a manifest in the QTI 3.0 packaging namespace, with LOM and QTI metadata's prefixes bound.
 *
 * @param version The `schemaversion` it writes.
 * @param resources The content of `resources`.
 * @param metadata What the manifest's `metadata` holds after `schemaversion`.
 * @returns The manifest's text.
 */
const manifestXml = (version: string, resources: string, metadata = ""): string =>
  `<manifest xmlns="${manifestNamespace}" xmlns:lom="http://ltsc.ieee.org/xsd/LOM" xmlns:qtimd="http://www.imsglobal.org/xsd/imsqti_metadata_v3p0" identifier="M"><metadata><schema>QTI Package</schema><schemaversion>${version}</schemaversion>${metadata}</metadata><organizations/><resources>${resources}</resources></manifest>`;

/**
 * Write one item resource whose `href` names its one file.
 *
 * @param identifier The resource's identifier.
 * @param inner What the resource holds after its file.
 * @returns The resource's text.
 */
const itemXml = (identifier: string, inner = ""): string =>
  `<resource identifier="${identifier}" type="imsqti_item_xmlv3p0" href="items/${identifier}.xml"><file href="items/${identifier}.xml"/>${inner}</resource>`;

/**
 * Write a 3.0.0 manifest whose root holds the given content after its metadata.
 *
 * @param content What the root holds after `metadata`.
 * @returns The manifest's text.
 */
const rootXml = (content: string): string =>
  `<manifest xmlns="${manifestNamespace}" identifier="M"><metadata><schema>QTI Package</schema><schemaversion>3.0.0</schemaversion></metadata>${content}</manifest>`;

/**
 * The path of the one resource's own LOM record in a manifest {@link lomItemXml} writes.
 */
const resourceLomPath = `${cp}manifest/${cp}resources/${cp}resource/${cp}metadata/${lom}lom`;

/**
 * Write a 3.0.0 manifest whose one item resource carries one LOM record in its own metadata.
 *
 * @param content What the resource's `lom` holds.
 * @param manifestMetadata What the manifest's own `metadata` holds after `schemaversion`.
 * @returns The manifest's text.
 */
const lomItemXml = (content: string, manifestMetadata = ""): string =>
  manifestXml(
    "3.0.0",
    `<resource identifier="a" type="imsqti_item_xmlv3p0" href="items/a.xml"><metadata><lom:lom>${content}</lom:lom></metadata><file href="items/a.xml"/></resource>`,
    manifestMetadata,
  );

/**
 * Write a LOM learning resource type.
 *
 * @param terms The `source` and `value` it holds.
 * @returns The type's text.
 */
const typeXml = (terms: string): string =>
  `<lom:learningResourceType>${terms}</lom:learningResourceType>`;

/**
 * Read an attribute in no namespace that an element must carry; the test fails when it has none.
 *
 * @param element The element.
 * @param local The attribute's local name.
 * @returns Its value.
 */
const attributeValue = (element: SourceElement, local: string): string => {
  const found = element.attributes.find(
    (candidate) => candidate.namespace === "" && candidate.local === local,
  );
  assert.isDefined(found, `${element.local} has ${local}`);

  return found.value;
};

/**
 * Take the manifest of a reading; the test fails when it is refused.
 *
 * @param reading The reading.
 * @returns The manifest.
 */
const manifestOf = (reading: Reading): Manifest => {
  assert.deepStrictEqual(
    Result.isFailure(reading) ? reading.failure.map((refusal) => refusal.rule) : [],
    [],
    "the manifest is read",
  );
  assert.isTrue(Result.isSuccess(reading));

  return Result.getOrThrow(reading);
};

/**
 * Take the refusals of a reading, none when it is read.
 *
 * @param reading The reading.
 * @returns Its refusals in order.
 */
const refusalsOf = (reading: Reading): readonly Refusal[] =>
  Result.isFailure(reading) ? reading.failure : [];

/**
 * Take one refusal's location path, `""` when it points elsewhere.
 *
 * @param refusal The refusal.
 * @returns Its path.
 */
const pathOf = (refusal: Refusal | undefined): string =>
  refusal?.location.kind === "path" ? refusal.location.path : "";

/**
 * Find a resource of a read manifest by identifier; the test fails when there is none.
 *
 * @param manifest The manifest.
 * @param identifier The resource's identifier.
 * @returns The resource.
 */
const resourceOf = (manifest: Manifest, identifier: string): ManifestResource => {
  const resource = manifest.resources.find((candidate) => candidate.identifier === identifier);
  assert.isDefined(resource, `the manifest has the resource ${identifier}`);

  return resource;
};

/**
 * Six extracted corpus manifests whose xmllint result is known: four that xmllint fails against
 * the profile their version names, and two it validates.
 */
const baseline = {
  begGuide: "QTI3_BeginnersGuide_Examples/BegGuide_March2025.zip.d/imsmanifest.xml",
  caseManifest: "qtiv3-examples/packaging/CASE/CASE.zip.d/imsmanifest.xml",
  cat: "qtiv3-examples/CAT/CAT_Test01_Adaptive_EchoAdapt.zip.d/imsmanifest.xml",
  lti: "qtiv3-examples/packaging/lti/lti.zip.d/imsmanifest.xml",
  samplePci: "qtiv3-examples/PCI/sample_pci.zip.d/imsmanifest.xml",
  testWithLti: "qtiv3-examples/packaging/testWithLti/testWithLti.zip.d/imsmanifest.xml",
} as const;

describe("package/manifest.ts", () => {
  describe("the corpus", { tags: ["corpus"] }, () => {
    it.effect(
      "[P-1] [P-4] BegGuide_March2025's manifest is read under CP 3.0.1, with its eleven resources",
      () =>
        Effect.gen(function* begGuide() {
          const manifest = manifestOf(yield* readCorpusManifest(baseline.begGuide));
          const test = resourceOf(manifest, "BGtest");

          assert.strictEqual(manifest.version, "3.0.1");
          assert.deepStrictEqual(
            manifest.resources.map((resource) => resource.identifier),
            [
              "firstexample",
              "beginnersguide007",
              "beginnersguide008",
              "beginnersguide009",
              "beginnersguide10",
              "beginnersguide011",
              "image_resource_1",
              "movie_resource_1",
              "movie_resource_2",
              "subtitle_resource_1",
              "BGtest",
            ],
          );
          assert.strictEqual(test.type, "imsqti_test_xmlv3p0");
          assert.deepStrictEqual(
            test.href.pipe(Option.flatMap((href) => href.path)),
            Option.some("BGtest.xml"),
          );
          assert.deepStrictEqual(
            manifest.resources.flatMap((resource) => resource.dependencies),
            ["image_resource_1", "movie_resource_1", "movie_resource_2", "subtitle_resource_1"],
          );
        }),
    );

    it.effect(
      "[P-1] [P-4] CASE's manifest is read under CP 3.0.0, its test depending on its three items",
      () =>
        Effect.gen(function* caseManifest() {
          const manifest = manifestOf(yield* readCorpusManifest(baseline.caseManifest));
          const test = resourceOf(manifest, "res_-TX_G06SAMP_000");

          assert.strictEqual(manifest.version, "3.0.0");
          assert.lengthOf(manifest.resources, 4);
          assert.deepStrictEqual(test.dependencies, [
            "res_-TX_G06SAMP_001",
            "res_-TX_G06SAMP_004",
            "res_-TX_G06SAMP_005",
          ]);
          assert.deepStrictEqual(
            test.files.map((file) => file.path),
            [Option.some("testitems/-TX_G06SAMP_000.xml")],
          );
        }),
    );

    it.effect(
      "[P-1] [P-4] lti's manifest is refused at its resource's type, naming imslti_xmlv1p1 and CP 3.0.0",
      () =>
        Effect.gen(function* lti() {
          const refusals = refusalsOf(yield* readCorpusManifest(baseline.lti));

          assert.deepStrictEqual(
            refusals.map((refusal) => refusal.rule),
            ["attribute-type"],
          );
          assert.strictEqual(
            pathOf(refusals[0]),
            `${cp}manifest/${cp}resources/${cp}resource/@type`,
          );
          assert.strictEqual(refusals[0]?.detail["value"], "imslti_xmlv1p1");
          assert.strictEqual(refusals[0]?.detail["schemaversion"], "3.0.0");
          assert.strictEqual(refusals[0]?.document, baseline.lti);
        }),
    );

    it.effect(
      "[P-1] [P-4] sample_pci's manifest is not-qti3-package, its root in the plain IMS CP namespace",
      () =>
        Effect.gen(function* samplePci() {
          const refusals = refusalsOf(yield* readCorpusManifest(baseline.samplePci));

          assert.deepStrictEqual(
            refusals.map((refusal) => refusal.rule),
            ["not-qti3-package"],
          );
          assert.deepStrictEqual(refusals[0]?.detail, {
            element: "manifest",
            namespace: imsCpNamespace,
          });
          assert.strictEqual(pathOf(refusals[0]), `{${imsCpNamespace}}manifest`);
        }),
    );

    it.effect(
      "[P-1] [P-4] agrees with xmllint's baseline: the four manifests it fails are refused, two it validates are read",
      () =>
        Effect.gen(function* agreement() {
          const fails: readonly (readonly [string, readonly RefusalRule[]])[] = [
            [baseline.cat, ["not-qti3-package"]],
            [baseline.samplePci, ["not-qti3-package"]],
            [baseline.lti, ["attribute-type"]],
            [baseline.testWithLti, ["attribute-type", "attribute-type", "attribute-type"]],
          ];
          for (const [path, rules] of fails) {
            const refusals = refusalsOf(yield* readCorpusManifest(path));

            assert.deepStrictEqual(
              refusals.map((refusal) => refusal.rule),
              rules,
              path,
            );
          }

          const ltiTypes = refusalsOf(yield* readCorpusManifest(baseline.testWithLti)).map(
            (refusal) => refusal.detail["value"],
          );
          assert.deepStrictEqual(ltiTypes, ["imslti_xmlv1p1", "imslti_xmlv1p1", "imslti_xmlv1p1"]);

          for (const path of [baseline.begGuide, baseline.caseManifest]) {
            const reading = yield* readCorpusManifest(path);

            assert.isTrue(Result.isSuccess(reading), path);
          }
        }),
    );
  });

  describe("the namespace and the profile", () => {
    it.effect("a root in no namespace is not-qti3-package", () =>
      Effect.gen(function* noNamespace() {
        const refusals = refusalsOf(yield* readXml('<manifest identifier="M"/>'));

        assert.deepStrictEqual(
          refusals.map((refusal) => refusal.rule),
          ["not-qti3-package"],
        );
        assert.deepStrictEqual(refusals[0]?.detail, { element: "manifest", namespace: "" });
      }),
    );

    it.effect("a manifest with no schemaversion is refused package-profile, naming none", () =>
      Effect.gen(function* noVersion() {
        const refusals = refusalsOf(
          yield* readXml(
            `<manifest xmlns="${manifestNamespace}" identifier="M"><metadata><schema>QTI Package</schema></metadata><organizations/><resources/></manifest>`,
          ),
        );

        assert.deepStrictEqual(
          refusals.map((refusal) => refusal.rule),
          ["package-profile"],
        );
        assert.deepStrictEqual(refusals[0]?.detail, {});
        assert.strictEqual(pathOf(refusals[0]), `${cp}manifest/${cp}metadata`);
      }),
    );

    it.effect("a manifest with no metadata is refused package-profile at its root", () =>
      Effect.gen(function* noMetadata() {
        const refusals = refusalsOf(
          yield* readXml(
            `<manifest xmlns="${manifestNamespace}" identifier="M"><organizations/><resources/></manifest>`,
          ),
        );

        assert.deepStrictEqual(
          refusals.map((refusal) => refusal.rule),
          ["package-profile"],
        );
        assert.strictEqual(pathOf(refusals[0]), `${cp}manifest`);
      }),
    );

    it.effect("a schemaversion of 1.0.0 is refused package-profile, naming it", () =>
      Effect.gen(function* oldVersion() {
        const refusals = refusalsOf(yield* readXml(manifestXml("1.0.0", itemXml("a"))));

        assert.deepStrictEqual(
          refusals.map((refusal) => refusal.rule),
          ["package-profile"],
        );
        assert.deepStrictEqual(refusals[0]?.detail, { schemaversion: "1.0.0" });
        assert.strictEqual(pathOf(refusals[0]), `${cp}manifest/${cp}metadata/${cp}schemaversion`);
      }),
    );

    it.effect("imslti_xmlv1p1, which CP 3.0.0 refuses, is read under CP 3.0.1", () =>
      Effect.gen(function* ltiUnder301() {
        const resource =
          '<resource identifier="lti" type="imslti_xmlv1p1"><file href="links/lti.xml"/></resource>';
        const manifest = manifestOf(yield* readXml(manifestXml("3.0.1", resource)));

        assert.strictEqual(resourceOf(manifest, "lti").type, "imslti_xmlv1p1");
        assert.deepStrictEqual(resourceOf(manifest, "lti").href, Option.none());
        assert.deepStrictEqual(
          refusalsOf(yield* readXml(manifestXml("3.0.0", resource))).map((refusal) => refusal.rule),
          ["attribute-type"],
        );
      }),
    );

    it.effect(
      "a manifest nested in a metadata lax wildcard, inside lom, gives no refusal (reading 6)",
      () =>
        Effect.gen(function* nestedManifest() {
          const manifest = manifestOf(
            yield* readXml(
              manifestXml(
                "3.0.0",
                itemXml("a"),
                `<lom:lom><manifest xmlns="${manifestNamespace}"><unknown/></manifest></lom:lom>`,
              ),
            ),
          );

          assert.deepStrictEqual(
            manifest.resources.map((resource) => resource.identifier),
            ["a"],
          );
        }),
    );

    it.effect(
      "the walk's refusals and the manifest's own rules are reported together, in that order",
      () =>
        Effect.gen(function* together() {
          const refusals = refusalsOf(
            yield* readXml(
              manifestXml(
                "3.0.0",
                `<resource identifier="a" type="imsqti_item_xmlv3p0" href="items/a.xml" extra="x"><file href="items/a.xml"/><dependency identifierref="b"/></resource>`,
              ),
            ),
          );

          assert.deepStrictEqual(
            refusals.map((refusal) => refusal.rule),
            ["unknown-attribute", "dependency-unresolved"],
          );
          assert.strictEqual(refusals[0]?.detail["schemaversion"], "3.0.0");
        }),
    );
  });

  describe("the child counts", () => {
    it.effect("a manifest with no resources is refused child-count at its root", () =>
      Effect.gen(function* noResources() {
        const refusals = refusalsOf(yield* readXml(rootXml("<organizations/>")));

        assert.deepStrictEqual(
          refusals.map((refusal) => refusal.rule),
          ["child-count"],
        );
        assert.strictEqual(pathOf(refusals[0]), `${cp}manifest`);
        assert.deepStrictEqual(refusals[0]?.detail, {
          child: `${cp}resources`,
          element: `${cp}manifest`,
          required: "exactly one",
          schemaversion: "3.0.0",
          source: "QTI 3.0 content packaging profile 3.0.0",
        });
      }),
    );

    it.effect("a manifest with no organizations is refused child-count at its root", () =>
      Effect.gen(function* noOrganizations() {
        const refusals = refusalsOf(
          yield* readXml(rootXml(`<resources>${itemXml("a")}</resources>`)),
        );

        assert.deepStrictEqual(
          refusals.map((refusal) => [refusal.rule, refusal.detail["child"]]),
          [["child-count", `${cp}organizations`]],
        );
        assert.strictEqual(pathOf(refusals[0]), `${cp}manifest`);
      }),
    );

    it.effect(
      "a manifest with two resources lists is refused child-count, its greatest count one",
      () =>
        Effect.gen(function* twoResources() {
          const refusals = refusalsOf(
            yield* readXml(rootXml("<organizations/><resources/><resources/>")),
          );

          assert.deepStrictEqual(
            refusals.map((refusal) => [
              refusal.rule,
              refusal.detail["child"],
              refusal.detail["required"],
            ]),
            [["child-count", `${cp}resources`, "exactly one"]],
          );
        }),
    );

    it.effect("a resource with no file entry is refused child-count, needing at least one", () =>
      Effect.gen(function* noFile() {
        const refusals = refusalsOf(
          yield* readXml(manifestXml("3.0.0", '<resource identifier="a" type="webcontent"/>')),
        );

        assert.deepStrictEqual(
          refusals.map((refusal) => [
            refusal.rule,
            refusal.detail["child"],
            refusal.detail["required"],
          ]),
          [["child-count", `${cp}file`, "at least one"]],
        );
        assert.strictEqual(pathOf(refusals[0]), `${cp}manifest/${cp}resources/${cp}resource`);
      }),
    );

    it.effect(
      "a manifest holding each required child once, its resources each with a file, passes the counts",
      () =>
        Effect.gen(function* counted() {
          const manifest = manifestOf(
            yield* readXml(
              rootXml(`<organizations/><resources>${itemXml("a")}${itemXml("b")}</resources>`),
            ),
          );

          assert.lengthOf(manifest.resources, 2);
        }),
    );
  });

  describe("the resources", () => {
    it.effect("a dependency naming no resource is refused dependency-unresolved", () =>
      Effect.gen(function* dependency() {
        const refusals = refusalsOf(
          yield* readXml(
            manifestXml(
              "3.0.0",
              `${itemXml("a", '<dependency identifierref="b"/>')}${itemXml("c", '<dependency identifierref="a"/>')}`,
            ),
          ),
        );

        assert.deepStrictEqual(
          refusals.map((refusal) => refusal.rule),
          ["dependency-unresolved"],
        );
        assert.deepStrictEqual(refusals[0]?.detail, { dependency: "b", resource: "a" });
        assert.strictEqual(
          pathOf(refusals[0]),
          `${cp}manifest/${cp}resources/${cp}resource[1]/${cp}dependency/@identifierref`,
        );
      }),
    );

    it.effect("a resource whose href no file entry references is refused child-count", () =>
      Effect.gen(function* unmatched() {
        const refusals = refusalsOf(
          yield* readXml(
            manifestXml(
              "3.0.0",
              '<resource identifier="a" type="imsqti_item_xmlv3p0" href="items/a.xml"><file href="items/b.xml"/></resource>',
            ),
          ),
        );

        assert.deepStrictEqual(
          refusals.map((refusal) => refusal.rule),
          ["child-count"],
        );
        assert.strictEqual(pathOf(refusals[0]), `${cp}manifest/${cp}resources/${cp}resource`);
        assert.strictEqual(refusals[0]?.detail["element"], `${cp}resource`);
      }),
    );

    it.effect(
      "a file entry references the resource's href through dot segments, escapes and launch parameters",
      () =>
        Effect.gen(function* matched() {
          const manifest = manifestOf(
            yield* readXml(
              manifestXml(
                "3.0.0",
                [
                  '<resource identifier="dots" type="webcontent" href="./items/a.xml"><file href="items/x/../a.xml"/></resource>',
                  '<resource identifier="escaped" type="webcontent" href="items/a%20b.html"><file href="items/a b.html"/></resource>',
                  '<resource identifier="launch" type="webcontent" href="items/c.html?mode=review#top"><file href="items/c.html"/></resource>',
                ].join(""),
              ),
            ),
          );

          assert.deepStrictEqual(
            manifest.resources.map((resource) =>
              resource.href.pipe(Option.flatMap((href) => href.path)),
            ),
            [
              Option.some("items/a.xml"),
              Option.some("items/a b.html"),
              Option.some("items/c.html"),
            ],
          );
          assert.deepStrictEqual(
            resourceOf(manifest, "launch").href.pipe(Option.map((href) => href.href)),
            Option.some("items/c.html?mode=review#top"),
          );
        }),
    );

    it.effect(
      "align-54 hrefs and keys E17: an href and an xml:base are collapsed before they resolve, so a padded href names its file (p102pad)",
      () =>
        Effect.gen(function* padded() {
          const manifest = manifestOf(
            yield* readXml(
              manifestXml(
                "3.0.0",
                [
                  '<resource identifier="choice" type="imsqti_item_xmlv3p0" href=" items/choice.xml "><file href=" items/choice.xml "/><file href="&#9;images/sign.png&#10;"/></resource>',
                  '<resource identifier="based" type="webcontent" xml:base=" shared/ " href="a  b.html"><file href=" a b.html"/></resource>',
                ].join(""),
              ),
            ),
          );

          assert.deepStrictEqual(resourceOf(manifest, "choice").files, [
            { href: " items/choice.xml ", path: Option.some("items/choice.xml") },
            { href: "\timages/sign.png\n", path: Option.some("images/sign.png") },
          ]);
          assert.deepStrictEqual(
            resourceOf(manifest, "based").href.pipe(Option.flatMap((href) => href.path)),
            Option.some("shared/a b.html"),
          );
        }),
    );

    it.effect(
      "align-54 hrefs and keys E17: a rooted or climbing file href, a non-document resource's and one under an xml:base that climbs out are external links, admitted with no path (p102root, p102climb)",
      () =>
        Effect.gen(function* external() {
          const manifest = manifestOf(
            yield* readXml(
              manifestXml(
                "3.0.0",
                [
                  '<resource identifier="choice" type="imsqti_item_xmlv3p0" href="items/choice.xml"><file href="items/choice.xml"/><file href="/abs.png"/><file href="items/../../outside.png"/></resource>',
                  '<resource identifier="page" type="webcontent" href="../a.html?mode=1"><file href="../a.html"/></resource>',
                  '<resource identifier="based" type="webcontent" xml:base="../up/" href="b.html"><file href="b.html"/></resource>',
                ].join(""),
              ),
            ),
          );

          assert.deepStrictEqual(resourceOf(manifest, "choice").files, [
            { href: "items/choice.xml", path: Option.some("items/choice.xml") },
            { href: "/abs.png", path: Option.none() },
            { href: "items/../../outside.png", path: Option.none() },
          ]);
          assert.deepStrictEqual(
            ["page", "based"].map((identifier) => resourceOf(manifest, identifier).files),
            [
              [{ href: "../a.html", path: Option.none() }],
              [{ href: "b.html", path: Option.none() }],
            ],
          );

          const refusals = refusalsOf(
            yield* readXml(
              manifestXml(
                "3.0.0",
                '<resource identifier="page" type="webcontent" href="/a.html"><file href="/b.html"/></resource>',
              ),
            ),
          );
          assert.deepStrictEqual(
            refusals.map((refusal) => [refusal.rule, refusal.detail["child"]]),
            [["child-count", "file entry that references its href /a.html"]],
          );
        }),
    );

    it.effect(
      "align-54 hrefs and keys E17: a document resource whose href is absolute, rooted or leads outside is refused package-path-outside, check document-entry (p102docext, p102docroot)",
      () =>
        Effect.gen(function* documentEntry() {
          const refusals = refusalsOf(
            yield* readXml(
              manifestXml(
                "3.0.0",
                [
                  itemXml("a"),
                  '<resource identifier="ext" type="imsqti_item_xmlv3p0" href="http://example.com/x.xml"><file href="http://example.com/x.xml"/></resource>',
                  '<resource identifier="rooted" type="imsqti_test_xmlv3p0" href="/x.xml"><file href="/x.xml"/></resource>',
                  '<resource identifier="up" type="resourcemetadata/xml" href="../x.xml"><file href="../x.xml"/></resource>',
                  '<resource identifier="based" type="imsqti_stimulus_xmlv3p0" xml:base="../" href="x.xml"><file href="x.xml"/></resource>',
                ].join(""),
              ),
            ),
          );

          assert.deepStrictEqual(
            refusals.map((refusal) => [refusal.rule, refusal.detail, pathOf(refusal)]),
            (
              [
                ["http://example.com/x.xml", 2],
                ["/x.xml", 3],
                ["../x.xml", 4],
                ["x.xml", 5],
              ] as const
            ).map(([href, index]) => [
              "package-path-outside",
              { check: "document-entry", path: href, reading: "102" },
              `${cp}manifest/${cp}resources/${cp}resource[${index}]/@href`,
            ]),
          );
        }),
    );

    it.effect(
      "align-54 hrefs and keys E17: a decoded / keeps its segment, so a%2Fb.xml names the file a%2Fb.xml, never b.xml in a directory a",
      () =>
        Effect.gen(function* escapedSlash() {
          const manifest = manifestOf(
            yield* readXml(
              manifestXml(
                "3.0.0",
                '<resource identifier="a" type="webcontent" href="items/a%2Fb.html"><file href="items/a%2Fb.html"/><file href="items/a%2fb%20c.html"/><file href="items/x%2Fy/../d.html"/><file href="items/a/b.html"/></resource>',
              ),
            ),
          );

          assert.deepStrictEqual(
            resourceOf(manifest, "a").files.map((file) => file.path),
            [
              Option.some("items/a%2Fb.html"),
              Option.some("items/a%2fb c.html"),
              Option.some("items/d.html"),
              Option.some("items/a/b.html"),
            ],
          );
        }),
    );

    it.effect("xml:base on the resources and a resource places its files", () =>
      Effect.gen(function* base() {
        const manifest = manifestOf(
          yield* readXml(
            `<manifest xmlns="${manifestNamespace}" identifier="M"><metadata><schemaversion>3.0.0</schemaversion></metadata><organizations/><resources xml:base="content/"><resource identifier="a" type="webcontent" xml:base="items/" href="a.html"><file href="a.html"/><file href="../shared/b.css"/></resource></resources></manifest>`,
          ),
        );

        assert.deepStrictEqual(
          resourceOf(manifest, "a").files.map((file) => file.path),
          [Option.some("content/items/a.html"), Option.some("content/shared/b.css")],
        );
      }),
    );

    it.effect(
      "under an absolute xml:base an href is absolute, and a file still references it (reading 35)",
      () =>
        Effect.gen(function* absoluteBase() {
          const manifest = manifestOf(
            yield* readXml(
              `<manifest xmlns="${manifestNamespace}" identifier="M"><metadata><schemaversion>3.0.0</schemaversion></metadata><organizations/><resources xml:base="https://example.com/pkg/"><resource identifier="a" type="webcontent" href="a.html"><file href="./a.html"/></resource></resources></manifest>`,
            ),
          );

          assert.deepStrictEqual(resourceOf(manifest, "a").files, [
            { href: "./a.html", path: Option.none() },
          ]);
          assert.deepStrictEqual(
            refusalsOf(
              yield* readXml(
                `<manifest xmlns="${manifestNamespace}" identifier="M"><metadata><schemaversion>3.0.0</schemaversion></metadata><organizations/><resources xml:base="https://example.com/pkg/"><resource identifier="a" type="webcontent" href="a.html"><file href="b.html"/></resource></resources></manifest>`,
              ),
            ).map((refusal) => refusal.rule),
            ["child-count"],
          );
        }),
    );
  });

  describe("the readings", () => {
    it.effect("qtiMetadata is read as a cp:metadata child and inside lom (reading 32)", () =>
      Effect.gen(function* qtiMetadata() {
        const qti =
          "<qtimd:qtiMetadata><qtimd:composite>false</qtimd:composite></qtimd:qtiMetadata>";
        const manifest = manifestOf(
          yield* readXml(
            manifestXml(
              "3.0.0",
              `${itemXml("a", `<metadata>${qti}</metadata>`)}${itemXml("b", `<metadata><lom:lom>${qti}</lom:lom></metadata>`)}`,
            ),
          ),
        );

        assert.lengthOf(manifest.resources, 2);
      }),
    );

    it.effect("a controlfile resource listing a packaged XSD is read (reading 33)", () =>
      Effect.gen(function* controlfile() {
        const manifest = manifestOf(
          yield* readXml(
            manifestXml(
              "3.0.1",
              '<resource identifier="schemas" type="controlfile"><file href="schemas/imsqti_asiv3p0p1_v1p0.xsd"/></resource>',
            ),
          ),
        );

        assert.strictEqual(resourceOf(manifest, "schemas").type, "controlfile");
        assert.deepStrictEqual(
          resourceOf(manifest, "schemas").files.map((file) => file.path),
          [Option.some("schemas/imsqti_asiv3p0p1_v1p0.xsd")],
        );
      }),
    );

    it.effect(
      "absolute hrefs are admitted and stored as written, with no package path (reading 35)",
      () =>
        Effect.gen(function* absolute() {
          const remote = "https://example.com/items/a.xml";
          const manifest = manifestOf(
            yield* readXml(
              manifestXml(
                "3.0.0",
                `<resource identifier="a" type="webcontent" href="${remote}?launch=1"><file href="${remote}"/></resource>`,
              ),
            ),
          );
          const resource = resourceOf(manifest, "a");

          assert.deepStrictEqual(resource.files, [{ href: remote, path: Option.none() }]);
          assert.deepStrictEqual(
            resource.href,
            Option.some({ href: `${remote}?launch=1`, path: Option.none() }),
          );
        }),
    );

    it.effect(
      "a file listed twice by one resource and once by another is admitted (reading 36)",
      () =>
        Effect.gen(function* duplicates() {
          const manifest = manifestOf(
            yield* readXml(
              manifestXml(
                "3.0.0",
                `${itemXml("a", '<file href="shared/s.css"/><file href="shared/s.css"/>')}${itemXml("b", '<file href="shared/s.css"/>')}`,
              ),
            ),
          );

          assert.deepStrictEqual(
            manifest.resources.map((resource) => resource.files.length),
            [3, 2],
          );
        }),
    );
  });

  it.effect("each resource carries the location of its element in the manifest", () =>
    Effect.gen(function* locations() {
      const manifest = manifestOf(
        yield* readXml(manifestXml("3.0.0", `${itemXml("a")}${itemXml("b")}`)),
      );

      assert.strictEqual(manifest.identifier, "M");
      assert.deepStrictEqual(
        manifest.resources.map((resource) => resource.location),
        [
          `${cp}manifest/${cp}resources/${cp}resource[1]`,
          `${cp}manifest/${cp}resources/${cp}resource[2]`,
        ],
      );
    }),
  );

  describe("resourceLom", () => {
    it.effect(
      "gives each resource the identifier entries, title strings and languages of its own LOM's general, as written, with where the general and the first of each are (reading 62, \"an item's or test's identifier and title are those its package's LOM metadata gives it\")",
      () =>
        Effect.gen(function* ownLom() {
          const general =
            '<lom:general><lom:identifier><lom:catalog>c</lom:catalog><lom:entry> a </lom:entry></lom:identifier><lom:identifier><lom:entry>other</lom:entry></lom:identifier><lom:title><lom:string language="en">Item  A</lom:string><lom:string language="de">Aufgabe A</lom:string></lom:title></lom:general>';
          const titleOnly =
            "<lom:general><lom:title><lom:string>Item B</lom:string></lom:title></lom:general>";
          const manifestLom =
            "<lom:lom><lom:general><lom:identifier><lom:entry>M</lom:entry></lom:identifier></lom:general></lom:lom>";
          const source = yield* readSource(
            location,
            new TextEncoder().encode(
              manifestXml(
                "3.0.0",
                [
                  `<resource identifier="a" type="imsqti_item_xmlv3p0" href="items/a.xml"><metadata><lom:lom>${general}</lom:lom></metadata><file href="items/a.xml"/></resource>`,
                  `<resource identifier="b" type="imsqti_item_xmlv3p0" href="items/b.xml"><metadata><lom:lom>${titleOnly}</lom:lom></metadata><file href="items/b.xml"/></resource>`,
                  `<resource identifier="c" type="imsqti_item_xmlv3p0" href="items/c.xml"><file href="items/c.xml"><metadata>${manifestLom}</metadata></file></resource>`,
                ].join(""),
                manifestLom,
              ),
            ),
          );
          const manifest = manifestOf(readManifest(source));
          const lomOf = resourceLom(source);
          const generalOf = (resource: string) =>
            `${resourceOf(manifest, resource).location}/${cp}metadata/${lom}lom/${lom}general`;

          assert.deepStrictEqual(lomOf.get(resourceOf(manifest, "a").location), [
            {
              identifier: Option.some<LomValues>({
                languages: [Option.none(), Option.none()],
                location: `${generalOf("a")}/${lom}identifier[1]`,
                values: [" a ", "other"],
              }),
              languages: [],
              location: generalOf("a"),
              title: Option.some<LomValues>({
                languages: [Option.some("en"), Option.some("de")],
                location: `${generalOf("a")}/${lom}title`,
                values: ["Item  A", "Aufgabe A"],
              }),
            },
          ]);
          assert.deepStrictEqual(lomOf.get(resourceOf(manifest, "b").location), [
            {
              identifier: Option.none(),
              languages: [],
              location: generalOf("b"),
              title: Option.some<LomValues>({
                languages: [Option.none()],
                location: `${generalOf("b")}/${lom}title`,
                values: ["Item B"],
              }),
            },
          ]);
          assert.deepStrictEqual(lomOf.get(resourceOf(manifest, "c").location), []);
          assert.strictEqual(lomOf.size, 3);
        }),
    );
    it.effect(
      "align-54 LOM languages E34: gives each general's languages and each title string's language as written, padding and an empty language kept, every identifier entry with none",
      () =>
        Effect.gen(function* lomLanguages() {
          const general =
            '<lom:general><lom:identifier><lom:entry>a</lom:entry></lom:identifier><lom:title><lom:string language=" EN-gb ">Item A</lom:string><lom:string language="">Item A</lom:string><lom:string>Item A</lom:string></lom:title><lom:language>en</lom:language><lom:language> de </lom:language><lom:language/></lom:general>';
          const source = yield* readSource(
            location,
            new TextEncoder().encode(
              manifestXml(
                "3.0.0",
                `<resource identifier="a" type="imsqti_item_xmlv3p0" href="items/a.xml"><metadata><lom:lom>${general}</lom:lom></metadata><file href="items/a.xml"/></resource>`,
              ),
            ),
          );
          const manifest = manifestOf(readManifest(source));
          const generalPath = `${resourceOf(manifest, "a").location}/${cp}metadata/${lom}lom/${lom}general`;
          const [read] = resourceLom(source).get(resourceOf(manifest, "a").location) ?? [];

          assert.deepStrictEqual(read?.languages, ["en", " de ", ""]);
          assert.strictEqual(read?.location, generalPath);
          assert.deepStrictEqual(
            read?.identifier.pipe(Option.map((values) => values.languages)),
            Option.some([Option.none()]),
          );
          assert.deepStrictEqual(
            read?.title.pipe(Option.map((values) => values.languages)),
            Option.some([Option.some(" EN-gb "), Option.some(""), Option.none()]),
          );
        }),
    );
  });

  describe("LOM vocabulary and caps (readings 122 and 130)", () => {
    it.effect(
      "align-54 LOM vocabulary E25: a learningResourceType of exam from the LOM vocabulary is refused lom-learning-resource-type at the type",
      () =>
        Effect.gen(function* lomExam() {
          const refusals = refusalsOf(
            yield* readXml(
              lomItemXml(
                `<lom:educational>${typeXml("<lom:source>LOMv1.0</lom:source><lom:value>exam</lom:value>")}</lom:educational>`,
              ),
            ),
          );

          assert.deepStrictEqual(
            refusals.map((refusal) => [refusal.rule, pathOf(refusal), refusal.detail]),
            [
              [
                "lom-learning-resource-type",
                `${resourceLomPath}/${lom}educational/${lom}learningResourceType`,
                { reading: "122", value: "exam" },
              ],
            ],
          );
        }),
    );

    it.effect(
      "align-54 LOM vocabulary E25: self assessment is refused likewise, its source unwritten, empty or LOMv1.0 padded, its value collapsed, in a resource's LOM and the manifest's own",
      () =>
        Effect.gen(function* lomSelfAssessment() {
          const types = [
            typeXml("<lom:value> self  assessment </lom:value>"),
            typeXml("<lom:source> </lom:source><lom:value>self assessment</lom:value>"),
            typeXml("<lom:value>self assessment</lom:value><lom:source> LOMv1.0 </lom:source>"),
          ].join("");
          const refusals = refusalsOf(
            yield* readXml(
              lomItemXml(
                `<lom:educational>${types}</lom:educational>`,
                `<lom:lom><lom:educational>${typeXml("<lom:value>self assessment</lom:value>")}</lom:educational></lom:lom>`,
              ),
            ),
          );
          const typePath = `${resourceLomPath}/${lom}educational/${lom}learningResourceType`;

          assert.deepStrictEqual(
            refusals.map((refusal) => [refusal.rule, pathOf(refusal), refusal.detail["value"]]),
            [
              [
                "lom-learning-resource-type",
                `${cp}manifest/${cp}metadata/${lom}lom/${lom}educational/${lom}learningResourceType`,
                "self assessment",
              ],
              ["lom-learning-resource-type", `${typePath}[1]`, "self assessment"],
              ["lom-learning-resource-type", `${typePath}[2]`, "self assessment"],
              ["lom-learning-resource-type", `${typePath}[3]`, "self assessment"],
            ],
          );
        }),
    );

    it.effect(
      "align-54 LOM vocabulary E25: an exam of another vocabulary's source, a LOM term in another case or spelling, and an interactivity type's exam are accepted",
      () =>
        Effect.gen(function* lomOtherVocabulary() {
          const educational = [
            typeXml("<lom:source>RDNLTSNType</lom:source><lom:value>exam</lom:value>"),
            typeXml("<lom:source>LOMv1.0</lom:source><lom:value>Exam</lom:value>"),
            typeXml("<lom:source>LOMv1.0</lom:source><lom:value>self-assessment</lom:value>"),
            typeXml("<lom:source>LOMv1.0</lom:source><lom:value>exercise</lom:value>"),
            "<lom:interactivityType><lom:source>LOMv1.0</lom:source><lom:value>exam</lom:value></lom:interactivityType>",
          ].join("");
          const manifest = manifestOf(
            yield* readXml(lomItemXml(`<lom:educational>${educational}</lom:educational>`)),
          );

          assert.lengthOf(manifest.resources, 1);
        }),
    );

    it.effect(
      "align-54 LOM vocabulary E33: a LOM element past its cap is refused child-count at the element, and a type with two values is not read for its vocabulary",
      () =>
        Effect.gen(function* lomCapped() {
          const general =
            "<lom:general><lom:title><lom:string>A</lom:string></lom:title><lom:title><lom:string>B</lom:string></lom:title></lom:general>";
          const technical =
            "<lom:technical><lom:duration><lom:duration>PT1M</lom:duration><lom:duration>PT2M</lom:duration></lom:duration></lom:technical>";
          const educational = `<lom:educational>${typeXml("<lom:value>exam</lom:value><lom:value>exam</lom:value>")}</lom:educational>`;
          const refusals = refusalsOf(
            yield* readXml(lomItemXml(`${general}${general}${technical}${educational}`)),
          );
          /**
           * The facts of a refusal of one LOM element's count.
           *
           * @param child The child's local name.
           * @param element The element's local name.
           * @returns The facts.
           */
          const capped = (child: string, element: string) => ({
            child: `${lom}${child}`,
            element: `${lom}${element}`,
            required: "at most one",
            schemaversion: "3.0.0",
            source: "reading 130",
          });

          assert.deepStrictEqual(
            refusals.map((refusal) => [refusal.rule, pathOf(refusal), refusal.detail]),
            [
              ["child-count", resourceLomPath, capped("general", "lom")],
              ["child-count", `${resourceLomPath}/${lom}general[1]`, capped("title", "general")],
              ["child-count", `${resourceLomPath}/${lom}general[2]`, capped("title", "general")],
              [
                "child-count",
                `${resourceLomPath}/${lom}technical/${lom}duration`,
                capped("duration", "duration"),
              ],
              [
                "child-count",
                `${resourceLomPath}/${lom}educational/${lom}learningResourceType`,
                capped("value", "learningResourceType"),
              ],
            ],
          );
        }),
    );

    it.effect(
      "align-54 LOM vocabulary E33: the caps are the loose LOM binding's Schematron, its 43 rules' 94 asserts each capping one child at one",
      () =>
        Effect.gen(function* lomSchematron() {
          const binding: XsdPath = "lom/imsmd_loose_v1p3p2.xsd";
          const schematron = "http://purl.oclc.org/dsdl/schematron";
          const capAssert = /^count\(lom:(?<child>[A-Za-z]+)\) = 0 or count\(lom:\k<child>\) = 1$/u;
          const directory = yield* xsdDirectory;
          const xsd = yield* readSource(
            binding,
            yield* Effect.tryPromise(() => readFile(nodePath.join(directory, binding))),
          );
          /**
           * Take an element's Schematron children of one local name.
           *
           * @param element The element.
           * @param local The children's local name.
           * @returns The children, in document order.
           */
          const schematronChildren = (element: SourceElement, local: string) =>
            element.children.filter(
              (child): child is SourceElement =>
                child.kind === "element" && child.namespace === schematron && child.local === local,
            );
          const rules = Array.from(walk(xsd), (visit) => visit.element).filter(
            (element) => element.namespace === schematron && element.local === "rule",
          );
          const asserted = rules.map((rule) => {
            const steps = attributeValue(rule, "context").split("/");
            for (const step of steps) {
              assert.match(step, /^lom:[A-Za-z]+$/u, "each context step is a LOM element");
            }

            const children = schematronChildren(rule, "assert").map((check) => {
              const test = attributeValue(check, "test");
              const matched = capAssert.exec(test);
              assert.isNotNull(matched, `${test} caps one child at one`);

              return matched.groups?.["child"] ?? "";
            });

            return [steps.map((step) => step.slice("lom:".length)).join("/"), children] as const;
          });
          const capped = asserted.filter(([, children]) => children.length > 0);

          assert.lengthOf(rules, 43);
          assert.lengthOf(
            asserted.flatMap(([, children]) => children),
            94,
          );
          assert.strictEqual(new Set(asserted.map(([context]) => context)).size, 43);
          assert.deepStrictEqual(
            asserted.filter(([, children]) => children.length === 0).map(([context]) => context),
            ["lom/technical/requirement", "lom/relation/resource"],
          );
          assert.deepStrictEqual(
            lomCaps,
            Object.fromEntries(
              capped.map(([context, children]) => [
                context,
                Object.fromEntries(children.map((child) => [child, 1])),
              ]),
            ),
          );
        }),
      { tags: ["qti-xsd"] },
    );

    it.effect(
      "align-54 LOM vocabulary E33: the elements the Schematron leaves unbounded repeat freely, in each category that repeats",
      () =>
        Effect.gen(function* lomUnbounded() {
          const general =
            "<lom:general><lom:identifier><lom:entry>a</lom:entry></lom:identifier><lom:identifier><lom:entry>b</lom:entry></lom:identifier><lom:language>en</lom:language><lom:language>fr</lom:language><lom:keyword><lom:string>x</lom:string></lom:keyword><lom:keyword><lom:string>y</lom:string></lom:keyword></lom:general>";
          const educational = `<lom:educational>${typeXml("<lom:source>LOMv1.0</lom:source><lom:value>exercise</lom:value>")}${typeXml("<lom:value>questionnaire</lom:value>")}</lom:educational>`;
          const classification =
            "<lom:classification><lom:keyword><lom:string>k</lom:string></lom:keyword></lom:classification>";
          const manifest = manifestOf(
            yield* readXml(
              lomItemXml(
                `${general}${educational}${educational}${classification}${classification}`,
              ),
            ),
          );

          assert.lengthOf(manifest.resources, 1);
        }),
    );
  });

  describe("ManifestDefect", () => {
    it("the ManifestDefect message names the repair: the element and attribute, and a renderer defect to report", () => {
      const defect = new ManifestDefect({ attribute: "identifier", element: "resource" });

      assert.isNotEmpty(defect.message);
      assert.include(defect.message, "resource");
      assert.include(defect.message, "identifier");
    });
  });
});

/**
 * The forms of a `dependency`'s `identifierref` that are no `xs:NCName`, each with the name a
 * case's title gives it (reading 152 as amended).
 */
const namelessRefs = [
  { form: "1a", name: "1a" },
  { form: "a b", name: "a b" },
  { form: "", name: "the empty string" },
  { form: "   ", name: "whitespace alone" },
  { form: "٠a", name: "U+0660 a" },
] as const;

describe("readManifest, align-54 r11 reading 152 names nothing: a dependency's identifierref names a resource as xs:IDREF reads it (reading 152 as amended)", () => {
  it.effect.each(namelessRefs)(
    "align-54 r11 reading 152 names nothing decision 457 (2): a dependency whose identifierref is $name names nothing, so it is refused attribute-type alone, not dependency-unresolved",
    ({ form }) =>
      Effect.gen(function* namelessDependency() {
        const refusals = refusalsOf(
          yield* readXml(
            manifestXml("3.0.0", itemXml("a", `<dependency identifierref="${form}"/>`)),
          ),
        );

        assert.deepStrictEqual(
          refusals.map((refusal) => [refusal.rule, pathOf(refusal)]),
          [
            [
              "attribute-type",
              `${cp}manifest/${cp}resources/${cp}resource/${cp}dependency/@identifierref`,
            ],
          ],
        );
      }),
  );

  it.effect(
    "align-54 r11 reading 152 names nothing decision 457 (3): a dependency written ' a ' names the resource a, and one written a names the resource written ' a ', since xs:ID and xs:IDREF collapse their whitespace",
    () =>
      Effect.gen(function* paddedDependency() {
        const paddedRef = manifestOf(
          yield* readXml(
            manifestXml(
              "3.0.0",
              `${itemXml("a")}${itemXml("c", '<dependency identifierref=" a "/>')}`,
            ),
          ),
        );
        const paddedResource = manifestOf(
          yield* readXml(
            manifestXml(
              "3.0.0",
              `<resource identifier=" a " type="imsqti_item_xmlv3p0" href="items/a.xml"><file href="items/a.xml"/></resource>${itemXml("c", '<dependency identifierref="a"/>')}`,
            ),
          ),
        );

        assert.deepStrictEqual(
          [paddedRef.resources.length, paddedResource.resources.length],
          [2, 2],
        );
      }),
  );
});

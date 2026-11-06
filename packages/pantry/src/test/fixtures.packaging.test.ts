import { createHash } from "node:crypto";
import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { ConfigProvider, Effect, FileSystem, Stream } from "effect";
import { ChildProcess, ChildProcessSpawner } from "effect/process";
import { readXml } from "@qti-pie/crust/read.ts";
import type { Element } from "@qti-pie/crust/tree.ts";
import {
  FIXTURES_VERSION,
  examplesTarball,
  fixtureNames,
  materialize,
  materializePackage,
  materializeSpec,
  materializeZip,
  specOf,
  transformHash,
} from "#pantry/test/fixtures.ts";
import type { FixtureName, FixtureSpec } from "#pantry/test/fixtures.ts";

/**
 * The directory every test root is made under: the package's gitignored `work/`.
 */
const workDirectory = path.resolve(import.meta.dirname, "../../work");

/**
 * The package's `src` directory, which the path-literal sweep reads.
 */
const sourceDirectory = path.resolve(import.meta.dirname, "..");

/**
 * Run `use` against a fresh, empty fixtures root that exists only for the call.
 *
 * @param use - The test body; receives the root it must expect everything under.
 * @returns The effect that creates the root, runs `use` with `GR8DES_QTI_FIXTURES` pointing at it
 *   and removes the root.
 */
const inFreshRoot = <A, E, R>(use: (root: string) => Effect.Effect<A, E, R>) =>
  Effect.gen(function* useFreshRoot() {
    const fs = yield* FileSystem.FileSystem;

    yield* fs.makeDirectory(workDirectory, { recursive: true });

    const root = yield* fs.makeTempDirectoryScoped({
      directory: workDirectory,
      prefix: "fixtures-packaging-test-",
    });
    const config = ConfigProvider.layerAdd(
      ConfigProvider.fromUnknown({ GR8DES_QTI_FIXTURES: root }),
      { asPrimary: true },
    );

    return yield* use(root).pipe(Effect.provide(config));
  }).pipe(Effect.scoped);

/**
 * Run `tar` and return its standard output as bytes.
 *
 * @param args - The arguments of `tar`.
 * @returns The bytes `tar` wrote, failing the test when it exits non-zero.
 */
const tarBytes = Effect.fn("tarBytes")(function* tarBytes(args: readonly string[]) {
  const spawner = yield* ChildProcessSpawner.ChildProcessSpawner;

  return yield* Effect.scoped(
    Effect.gen(function* collectOutput() {
      const handle = yield* spawner.spawn(ChildProcess.make("tar", args, { stdin: "ignore" }));
      const chunks = yield* Stream.runCollect(handle.stdout);
      const code = yield* handle.exitCode;

      assert.strictEqual(code, ChildProcessSpawner.ExitCode(0), `tar ${args.join(" ")} failed`);

      return Buffer.concat(chunks);
    }),
  );
});

/**
 * Read one member of the examples tarball straight from the tarball, with no fixture code.
 *
 * @param member - The member's path below the tarball's one top directory.
 * @returns The member's bytes.
 */
const tarballMember = Effect.fn("tarballMember")(function* tarballMember(member: string) {
  const tarball = yield* Effect.orDie(examplesTarball);
  const listing = (yield* tarBytes(["-tzf", tarball])).toString("utf-8").split("\n");
  const entry = listing.find((line) => line.endsWith(`/${member}`));

  assert.isDefined(entry, `the tarball has no member ${member}`);

  return yield* tarBytes(["-xOzf", tarball, entry ?? ""]);
});

/**
 * Every path under a directory, files only, sorted.
 *
 * @param dir - The directory to list.
 * @returns The paths relative to `dir`.
 */
const filesUnder = Effect.fn("filesUnder")(function* filesUnder(dir: string) {
  const fs = yield* FileSystem.FileSystem;
  const entries = yield* fs.readDirectory(dir, { recursive: true });
  const files: string[] = [];

  for (const entry of entries) {
    if ((yield* fs.stat(`${dir}/${entry}`)).type === "File") {
      files.push(entry);
    }
  }

  return files.toSorted();
});

/**
 * The hex sha256 of some bytes.
 *
 * @param bytes - The bytes to hash.
 * @returns The 64 lower-case hex digits.
 */
const sha256 = (bytes: Uint8Array): string => createHash("sha256").update(bytes).digest("hex");

/**
 * The tarball member `simple` is extracted from.
 */
const simpleMember = "qtiv3-examples/packaging/simple/simple.zip";

/**
 * A loose, non-zip member of the tarball.
 */
const looseMember = "qtiv3-examples/tests/rtest01-fragment.xml";

/**
 * One positive of the metadata cut: what its manifest holds, and the hand-broken copies made from
 * it.
 */
interface MetadataCut {
  /**
   * The number of elements of each local name that the positive's edits add.
   */
  readonly counts: Readonly<Record<string, number>>;
  readonly name: FixtureName;
  /**
   * The copies made from the positive, each differing from it in its manifest or its record. They
   * are named negatives for most, which a rule refuses; `filelom-qmd` is grouped here for its
   * manifest and is not refused (its file-level `qtiMetadata` is stored as foreign content).
   */
  readonly negatives: readonly FixtureName[];
  /**
   * The number of content packaging `resource` elements in the positive's manifest.
   */
  readonly resources: number;
}

/**
 * The five positives of the metadata cut with their negatives.
 */
const metadataCuts: readonly MetadataCut[] = [
  {
    counts: { curriculumStandardsMetadataSet: 2 },
    name: "csm",
    negatives: ["csm-no-labelled-guid", "csm-two-guids", "csm-no-guid", "csm-two-sets"],
    resources: 1,
  },
  {
    counts: { dependency: 1 },
    name: "extmeta",
    negatives: [
      "extmeta-item-root",
      "extmeta-item-href",
      "extmeta-two-resources",
      "extmeta-hrefless",
    ],
    resources: 2,
  },
  {
    counts: { curriculumStandardsMetadataSet: 2, lom: 4 },
    name: "filelom",
    negatives: ["filelom-qmd", "filelom-two-metadata"],
    resources: 1,
  },
  {
    counts: { annotation: 1, classification: 1, educational: 2, relation: 1 },
    name: "lomrest",
    negatives: [
      "lomrest-two-titles",
      "lomrest-two-purposes",
      "lomrest-two-kinds",
      "lomrest-exam",
      "lomrest-self-assessment",
    ],
    resources: 1,
  },
  {
    counts: { qtiMetadata: 1 },
    name: "nestedqmd",
    negatives: ["nestedqmd-manifest-lom", "nestedqmd-both"],
    resources: 1,
  },
];

/**
 * Every name of the metadata cut: the five positives and their negatives.
 */
const metadataNames: readonly FixtureName[] = metadataCuts.flatMap((cut) => [
  cut.name,
  ...cut.negatives,
]);

/**
 * The namespace of the content packaging elements, whose `resource` is not the LOM's.
 */
const cpNamespace = "http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1";

/**
 * Every element of a tree, the root first, in document order.
 *
 * @param element - The subtree's root.
 * @returns The element and all its descendants.
 */
const elementsOf = (element: Element): readonly Element[] => [
  element,
  ...element.children.flatMap((child) => (child.kind === "element" ? elementsOf(child) : [])),
];

/**
 * Read a materialized package's manifest as a tree.
 *
 * @param dir - The package directory.
 * @returns The manifest's elements in document order.
 */
const manifestElements = Effect.fn("manifestElements")(function* manifestElements(dir: string) {
  const fs = yield* FileSystem.FileSystem;
  const doc = yield* Effect.orDie(readXml(yield* fs.readFile(`${dir}/imsmanifest.xml`)));

  return elementsOf(doc.root);
});

/**
 * The bytes a metadata fixture differs in: its manifest and, when it has one, its metadata record.
 *
 * @param dir - The package directory.
 * @returns The two files' text, the record as `""` when the package holds none.
 */
const manifestAndRecord = Effect.fn("manifestAndRecord")(function* manifestAndRecord(dir: string) {
  const fs = yield* FileSystem.FileSystem;
  const record = `${dir}/meta/choice.xml`;

  return [
    yield* fs.readFileString(`${dir}/imsmanifest.xml`),
    (yield* fs.exists(record)) ? yield* fs.readFileString(record) : "",
  ] as const;
});

/**
 * The tarball member `lti` is extracted from, which the two `lti` fixtures derive from.
 */
const ltiMember = "qtiv3-examples/packaging/lti/lti.zip";

/**
 * One positive of the variant, outcome, LTI, bytes and response processing cut: where it comes
 * from, how many `resource` elements its manifest holds and the hand-broken copies made from it.
 */
interface ContentCut {
  readonly member: string;
  readonly name: FixtureName;
  readonly negatives: readonly FixtureName[];
  readonly resources: number;
}

/**
 * The seven positives of the cut with their 14 negatives.
 */
const contentCuts: readonly ContentCut[] = [
  {
    member: simpleMember,
    name: "variant",
    negatives: [
      "variant-301",
      "variant-self-ref",
      "variant-no-resource",
      "variant-id-clash",
      "variant-tactile",
      "variant-bad-uri",
      "variant-two-atinteroperable",
      "variant-two-complexity",
      "variant-no-metadata",
      "variant-before-file",
    ],
    resources: 2,
  },
  { member: simpleMember, name: "variant-padded", negatives: [], resources: 2 },
  { member: simpleMember, name: "outcome", negatives: ["outcome-title"], resources: 2 },
  { member: ltiMember, name: "lti301", negatives: [], resources: 1 },
  { member: ltiMember, name: "lti300", negatives: ["lti300-as-301"], resources: 1 },
  { member: simpleMember, name: "bytes", negatives: ["bytes-webcontent-item"], resources: 10 },
  { member: simpleMember, name: "resproc", negatives: ["resproc-webcontent"], resources: 2 },
];

/**
 * Every name of the cut, positives and negatives.
 */
const contentNames: readonly FixtureName[] = contentCuts.flatMap((cut) => [
  cut.name,
  ...cut.negatives,
]);

/**
 * How many times a text holds a needle.
 *
 * @param text - The text to search.
 * @param needle - The string to count.
 * @returns The number of non-overlapping occurrences.
 */
const occurrences = (text: string, needle: string): number => text.split(needle).length - 1;

/**
 * The tarball member the usage-data fixtures derive from.
 */
const usageMember = "qtiv3-examples/packaging/usageData/usageData.zip";

/**
 * The namespace of the QTI 3 usage-data root, which the IMS 2.2 usage data does not share.
 */
const usageNamespace = "http://www.imsglobal.org/xsd/imsqti_usagedata_v3p0";

/**
 * The three positives of the usage-data cut and the hand-broken copies of the first, each a copy of
 * `usage3` with one edit.
 */
const usageCuts: readonly ContentCut[] = [
  {
    member: usageMember,
    name: "usage3",
    negatives: [
      "usage3-integer-float",
      "usage3-no-target",
      "usage3-two-values",
      "usage3-ordinary-mapping",
      "usage3-no-map-entry",
      "usage3-bad-month",
      "usage3-feb-30",
      "usage3-bad-context",
      "usage3-bad-name",
    ],
    resources: 1,
  },
  { member: usageMember, name: "usage3-typed", negatives: [], resources: 1 },
  { member: usageMember, name: "usage3-padded", negatives: [], resources: 1 },
  { member: usageMember, name: "usage3-float-padded", negatives: [], resources: 1 },
];

/**
 * Every name of the usage-data cut, positives and negatives.
 */
const usageNames: readonly FixtureName[] = usageCuts.flatMap((cut) => [cut.name, ...cut.negatives]);

/**
 * Digest every file of a package, so two packages are equal exactly when they hold the same paths
 * with the same bytes.
 *
 * @param dir - The package directory.
 * @returns One `path:sha256` string per file, sorted.
 */
const treeDigest = Effect.fn("treeDigest")(function* treeDigest(dir: string) {
  const fs = yield* FileSystem.FileSystem;
  const digest: string[] = [];

  for (const file of yield* filesUnder(dir)) {
    digest.push(`${file}:${sha256(yield* fs.readFile(`${dir}/${file}`))}`);
  }

  return digest;
});

/**
 * The text of a package's manifest.
 *
 * @param dir - The package directory.
 * @returns The manifest as a string.
 */
const manifestText = Effect.fn("manifestText")(function* manifestText(dir: string) {
  const fs = yield* FileSystem.FileSystem;

  return yield* fs.readFileString(`${dir}/imsmanifest.xml`);
});

/**
 * The `type` attribute of a manifest `resource`.
 *
 * @param resource - The element.
 * @returns The attribute's value, or `undefined` when there is none.
 */
const typeOf = (resource: Element): string | undefined =>
  resource.attributes.find((attribute) => attribute.local === "type")?.value;

layer(NodeServices.layer, { excludeTestServices: true })("test/fixtures.ts (packaging)", (it) => {
  it.effect("materializeZip keeps the member's bytes as one file named by the zip", () =>
    inFreshRoot((root) =>
      Effect.gen(function* zipAsFile() {
        const fs = yield* FileSystem.FileSystem;
        const file = yield* materializeZip("simple");
        const expected = yield* tarballMember(simpleMember);
        const actual = yield* fs.readFile(file);

        assert.isTrue(file.endsWith("/simple.zip"));
        assert.match(path.relative(root, file), /^simple\.zip-[0-9a-f]{12}\/simple\.zip$/u);
        assert.isAbove(expected.length, 0);
        assert.strictEqual(actual.length, expected.length);
        assert.strictEqual(sha256(actual), sha256(expected));

        const before = yield* fs.readDirectory(root, { recursive: true });
        const again = yield* materializeZip("simple");
        const after = yield* fs.readDirectory(root, { recursive: true });

        assert.strictEqual(again, file);
        assert.deepStrictEqual(after, before);
        assert.isFalse(after.some((entry) => entry.includes(".tmp-")));
      }),
    ),
  );

  it.effect("a loose member is placed as the one file of its directory", () =>
    inFreshRoot(() =>
      Effect.gen(function* looseMemberSource() {
        const fs = yield* FileSystem.FileSystem;
        const dir = yield* materializeSpec({ edits: [], member: looseMember, name: "loose" });
        const expected = yield* tarballMember(looseMember);

        assert.deepStrictEqual(yield* filesUnder(dir), ["rtest01-fragment.xml"]);
        assert.deepStrictEqual(
          [...(yield* fs.readFile(`${dir}/rtest01-fragment.xml`))],
          [...expected],
        );
      }),
    ),
  );

  it.effect("addFile, copyFile and deleteFile derive a package from simple", () =>
    inFreshRoot(() =>
      Effect.gen(function* fileEdits() {
        const fs = yield* FileSystem.FileSystem;
        const spec: FixtureSpec = {
          edits: [
            { _tag: "addFile", path: "a/b.txt", source: { text: "x" } },
            { _tag: "copyFile", from: "choice.xml", to: "copy/choice.xml" },
            { _tag: "deleteFile", path: "images/sign.png" },
            { _tag: "addFile", path: "loose/r.xml", source: { member: looseMember } },
            {
              _tag: "addFile",
              path: "links/s.xml",
              source: {
                path: "links/streaming_video_experiment101.xml",
                zip: "qtiv3-examples/packaging/lti/lti.zip",
              },
            },
          ],
          member: simpleMember,
          name: "file-edits",
        };
        const dir = yield* materializeSpec(spec);
        const simple = yield* materialize("simple");

        assert.deepStrictEqual(yield* filesUnder(dir), [
          "a/b.txt",
          "choice.xml",
          "copy/choice.xml",
          "imsmanifest.xml",
          "links/s.xml",
          "loose/r.xml",
        ]);
        assert.strictEqual(yield* fs.readFileString(`${dir}/a/b.txt`), "x");
        assert.deepStrictEqual(
          [...(yield* fs.readFile(`${dir}/copy/choice.xml`))],
          [...(yield* fs.readFile(`${simple}/choice.xml`))],
        );
        assert.strictEqual((yield* fs.readFile(`${dir}/loose/r.xml`)).length, 822);
        assert.strictEqual((yield* fs.readFile(`${dir}/links/s.xml`)).length, 2298);
      }),
    ),
  );

  it.effect("materializePackage('usageData') holds the manifest and three usage files", () =>
    inFreshRoot(() =>
      Effect.gen(function* usageDataPackage() {
        const dir = yield* materializePackage("usageData");
        const files = yield* filesUnder(dir);

        assert.strictEqual(files.length, 4);
        assert.include(files, "imsmanifest.xml");
        assert.strictEqual(files.filter((file) => /^USAGE-.*\.xml$/u.test(file)).length, 3);
      }),
    ),
  );

  for (const name of metadataNames) {
    it.effect(`metadata ${name} is in the table and materializes under the hash it names`, () =>
      inFreshRoot((root) =>
        Effect.gen(function* metadataPath() {
          assert.include(fixtureNames, name);

          const spec = specOf(name);

          assert.strictEqual(spec.name, name);
          assert.strictEqual(spec.member, specOf("simple").member);
          assert.strictEqual(
            yield* materialize(name),
            `${root}/${name}-${transformHash(spec, FIXTURES_VERSION).slice(0, 12)}`,
          );
        }),
      ),
    );
  }

  it.effect("the usage-data cut's names are distinct, in the table and under distinct hashes", () =>
    Effect.sync(() => {
      assert.strictEqual(new Set(usageNames).size, usageNames.length);

      for (const name of usageNames) {
        assert.include(fixtureNames, name);
      }

      assert.strictEqual(
        new Set(usageNames.map((name) => transformHash(specOf(name), FIXTURES_VERSION))).size,
        usageNames.length,
      );
    }),
  );

  it.effect("the table's names and the cuts' transform hashes are distinct", () =>
    Effect.sync(() => {
      assert.strictEqual(new Set(fixtureNames).size, fixtureNames.length);
      assert.strictEqual(
        new Set(metadataNames.map((name) => transformHash(specOf(name), FIXTURES_VERSION))).size,
        metadataNames.length,
      );
      assert.strictEqual(contentNames.length, 21);
      assert.strictEqual(
        new Set(contentNames.map((name) => transformHash(specOf(name), FIXTURES_VERSION))).size,
        contentNames.length,
      );
    }),
  );

  for (const cut of metadataCuts) {
    it.effect(
      `metadata positive ${cut.name} is a manifest with the resources and elements it adds`,
      () =>
        inFreshRoot(() =>
          Effect.gen(function* metadataPositiveContents() {
            const elements = yield* manifestElements(yield* materialize(cut.name));
            const named = (local: string) => elements.filter((element) => element.local === local);

            assert.strictEqual(
              named("resource").filter((element) => element.namespace === cpNamespace).length,
              cut.resources,
              cut.name,
            );

            for (const [local, count] of Object.entries(cut.counts)) {
              assert.strictEqual(named(local).length, count, `${cut.name}: ${local}`);
            }
          }),
        ),
    );
  }

  it.effect("nestedqmd holds its qtiMetadata as the last child of the resource lom", () =>
    inFreshRoot(() =>
      Effect.gen(function* nestedQtiMetadata() {
        const elements = yield* manifestElements(yield* materialize("nestedqmd"));
        const block = elements.find((element) => element.local === "qtiMetadata");
        const owner = elements.find((element) => element.children.some((child) => child === block));
        const lastChild = owner?.children.findLast((child) => child.kind === "element");

        assert.strictEqual(owner?.local, "lom");
        assert.strictEqual(lastChild, block);
        assert.isTrue(elements.some((element) => element.local === "lom" && element !== owner));
      }),
    ),
  );

  it.effect("extmeta's record is the published metadata, xml:lang included", () =>
    inFreshRoot(() =>
      Effect.gen(function* externalRecord() {
        const fs = yield* FileSystem.FileSystem;
        const dir = yield* materialize("extmeta");
        const record = yield* fs.readFileString(`${dir}/meta/choice.xml`);

        assert.include(record, '<string xml:lang="en">jacs</string>');
        assert.include(record, '<string xml:lang="en">Mathematics</string>');
        assert.deepStrictEqual(yield* filesUnder(dir), [
          "choice.xml",
          "images/sign.png",
          "imsmanifest.xml",
          "meta/choice.xml",
        ]);
      }),
    ),
  );

  for (const cut of metadataCuts) {
    for (const name of cut.negatives) {
      it.effect(
        `metadata negative ${name} differs from its positive ${cut.name} in the manifest or the record`,
        () =>
          inFreshRoot(() =>
            Effect.gen(function* metadataNegativeDiffers() {
              const base = yield* manifestAndRecord(yield* materialize(cut.name));
              const broken = yield* manifestAndRecord(yield* materialize(name));

              assert.notDeepEqual(broken, base, name);
            }),
          ),
      );
    }
  }

  for (const cut of contentCuts) {
    for (const name of [cut.name, ...cut.negatives]) {
      it.effect(`content ${name} is in the table and materializes under the hash it names`, () =>
        inFreshRoot((root) =>
          Effect.gen(function* contentPath() {
            assert.include(fixtureNames, name);

            const spec = specOf(name);

            assert.strictEqual(spec.name, name);
            assert.strictEqual(spec.member, cut.member, name);
            assert.strictEqual(
              yield* materialize(name),
              `${root}/${name}-${transformHash(spec, FIXTURES_VERSION).slice(0, 12)}`,
            );
          }),
        ),
      );
    }
  }

  for (const cut of contentCuts) {
    it.effect(`content positive ${cut.name} holds the resources its row names`, () =>
      inFreshRoot(() =>
        Effect.gen(function* contentResources() {
          const elements = yield* manifestElements(yield* materialize(cut.name));

          assert.strictEqual(
            elements.filter(
              (element) => element.local === "resource" && element.namespace === cpNamespace,
            ).length,
            cut.resources,
            cut.name,
          );
        }),
      ),
    );
  }

  it.effect("variant-padded keeps its identifier, boolean and tab as written", () =>
    inFreshRoot(() =>
      Effect.gen(function* paddedVariant() {
        const text = yield* manifestText(yield* materialize("variant-padded"));
        const plain = yield* manifestText(yield* materialize("variant"));

        assert.include(text, 'identifier=" v1 "');
        assert.include(text, "> true <");
        assert.include(text, "es&#9;ES");
        assert.notInclude(plain, 'identifier=" v1 "');
        assert.notInclude(plain, "atInteroperable");
      }),
    ),
  );

  it.effect("variant is a second item resource, its translated copy and a variant on choice", () =>
    inFreshRoot(() =>
      Effect.gen(function* variantContents() {
        const fs = yield* FileSystem.FileSystem;
        const dir = yield* materialize("variant");
        const elements = yield* manifestElements(dir);
        const variants = elements.filter((element) => element.local === "variant");
        const copy = yield* fs.readFileString(`${dir}/es/choice.xml`);

        assert.strictEqual(variants.length, 1);
        assert.strictEqual(
          variants[0]?.attributes.find((attribute) => attribute.local === "identifierref")?.value,
          "choice_es",
        );
        assert.include(copy, 'identifier="choice_es"');
        assert.notInclude(copy, 'title="Unattended Luggage"');
      }),
    ),
  );

  it.effect("outcome adds the outcome declaration file, 567 bytes, and choice depends on it", () =>
    inFreshRoot(() =>
      Effect.gen(function* outcomeContents() {
        const fs = yield* FileSystem.FileSystem;
        const dir = yield* materialize("outcome");
        const text = yield* manifestText(dir);

        assert.strictEqual((yield* fs.readFile(`${dir}/testoutcome01.xml`)).length, 567);
        assert.include(text, 'identifier="Outcome_01"');
        assert.include(text, 'resourcePartId="SCORE"');
        assert.include(text, '<dependency identifierref="Outcome_01"/>');
        assert.notInclude(text, "imscp:");
      }),
    ),
  );

  it.effect("lti301 reads 3.0.1 and lti300 keeps 3.0.0 under the basic LTI type", () =>
    inFreshRoot(() =>
      Effect.gen(function* ltiVersions() {
        const lti301 = yield* manifestText(yield* materialize("lti301"));
        const lti300 = yield* manifestText(yield* materialize("lti300"));

        assert.include(lti301, "<schemaversion>3.0.1</schemaversion>");
        assert.include(lti301, 'type="imslti_xmlv1p1"');
        assert.include(lti300, "<schemaversion>3.0.0</schemaversion>");
        assert.include(lti300, 'type="imsbasiclti_xmlv1p3"');
        assert.notInclude(lti300, "imslti_xmlv1p1");
      }),
    ),
  );

  it.effect("bytes holds one file per type and its fragment's root is div", () =>
    inFreshRoot(() =>
      Effect.gen(function* bytesContents() {
        const fs = yield* FileSystem.FileSystem;
        const dir = yield* materialize("bytes");
        const elements = yield* manifestElements(dir);
        const resources = elements.filter(
          (element) => element.local === "resource" && element.namespace === cpNamespace,
        );
        const fragment = resources.find(
          (resource) => typeOf(resource) === "imsqti_fragment_xmlv3p0",
        );
        const href = fragment?.attributes.find((attribute) => attribute.local === "href")?.value;

        assert.strictEqual(new Set(resources.map(typeOf)).size, 10);
        assert.isDefined(href);

        const doc = yield* Effect.orDie(readXml(yield* fs.readFile(`${dir}/${href ?? ""}`)));

        assert.strictEqual(doc.root.local, "div");
      }),
    ),
  );

  it.effect("resproc's file is the published match_correct template", () =>
    inFreshRoot(() =>
      Effect.gen(function* responseProcessing() {
        const fs = yield* FileSystem.FileSystem;
        const dir = yield* materialize("resproc");
        const expected = yield* Effect.orDie(
          Effect.gen(function* member() {
            const zip = yield* materializeZip("maxfiles");
            const spawner = yield* ChildProcessSpawner.ChildProcessSpawner;

            return yield* Effect.scoped(
              Effect.gen(function* unzipOut() {
                const handle = yield* spawner.spawn(
                  ChildProcess.make("unzip", ["-p", zip, "rptemplates/match_correct.xml"], {
                    stdin: "ignore",
                  }),
                );

                return Buffer.concat(yield* Stream.runCollect(handle.stdout));
              }),
            );
          }),
        );

        assert.strictEqual(
          sha256(yield* fs.readFile(`${dir}/rp/match_correct.xml`)),
          sha256(expected),
        );
        assert.include(yield* manifestText(dir), 'type="imsqti_resprocessing_xmlv3p0"');
      }),
    ),
  );

  for (const cut of contentCuts) {
    for (const name of cut.negatives) {
      it.effect(`content negative ${name} differs from its positive ${cut.name}`, () =>
        inFreshRoot(() =>
          Effect.gen(function* contentNegativeDiffers() {
            const base = yield* treeDigest(yield* materialize(cut.name));

            assert.notDeepEqual(yield* treeDigest(yield* materialize(name)), base, name);
          }),
        ),
      );
    }
  }

  for (const name of usageNames) {
    it.effect(`usage ${name} is in the table and materializes under the hash it names`, () =>
      inFreshRoot((root) =>
        Effect.gen(function* usagePath() {
          assert.include(fixtureNames, name);

          const spec = specOf(name);

          assert.strictEqual(spec.name, name);
          assert.strictEqual(spec.member, usageMember, name);
          assert.strictEqual(
            yield* materialize(name),
            `${root}/${name}-${transformHash(spec, FIXTURES_VERSION).slice(0, 12)}`,
          );
        }),
      ),
    );
  }

  for (const cut of usageCuts) {
    it.effect(
      `usage positive ${cut.name} holds one resource and the usage file, no USAGE-*.xml`,
      () =>
        inFreshRoot(() =>
          Effect.gen(function* usageResource() {
            const dir = yield* materialize(cut.name);
            const elements = yield* manifestElements(dir);
            const files = yield* filesUnder(dir);

            assert.strictEqual(
              elements.filter(
                (element) => element.local === "resource" && element.namespace === cpNamespace,
              ).length,
              cut.resources,
              cut.name,
            );
            assert.deepStrictEqual(files, ["example.xml", "imsmanifest.xml"], cut.name);
            assert.isFalse(
              files.some((file) => /^USAGE-.*\.xml$/u.test(file)),
              cut.name,
            );
          }),
        ),
    );
  }

  it.effect("usage3's example.xml is a usageData root in the QTI 3 usage-data namespace", () =>
    inFreshRoot(() =>
      Effect.gen(function* usageRoot() {
        const fs = yield* FileSystem.FileSystem;
        const dir = yield* materialize("usage3");
        const doc = yield* Effect.orDie(readXml(yield* fs.readFile(`${dir}/example.xml`)));

        assert.strictEqual(doc.root.local, "usageData");
        assert.strictEqual(doc.root.namespace, usageNamespace);
        assert.notInclude(yield* fs.readFileString(`${dir}/example.xml`), "baseType");
      }),
    ),
  );

  it.effect("usage3-typed types every value, as float or as identifier", () =>
    inFreshRoot(() =>
      Effect.gen(function* typedValues() {
        const fs = yield* FileSystem.FileSystem;
        const typed = yield* fs.readFileString(`${yield* materialize("usage3-typed")}/example.xml`);
        const plain = yield* fs.readFileString(`${yield* materialize("usage3")}/example.xml`);

        assert.isAbove(occurrences(typed, 'baseType="float"'), 0);
        assert.isAbove(occurrences(typed, 'baseType="identifier"'), 0);
        assert.strictEqual(
          occurrences(typed, 'baseType="float"') + occurrences(typed, 'baseType="identifier"'),
          occurrences(plain, "<value>"),
        );
        assert.strictEqual(occurrences(typed, "<value>"), 0);
      }),
    ),
  );

  it.effect("usage3-padded keeps its name, tab and value padding as written", () =>
    inFreshRoot(() =>
      Effect.gen(function* paddedUsage() {
        const fs = yield* FileSystem.FileSystem;
        const padded = yield* fs.readFileString(
          `${yield* materialize("usage3-padded")}/example.xml`,
        );
        const plain = yield* fs.readFileString(`${yield* materialize("usage3")}/example.xml`);

        assert.match(padded, /name=" \S+ "/u);
        assert.include(padded, "&#9;");
        assert.include(padded, "> 0.87 <");
        assert.include(padded, 'identifier=" item1 "');
        assert.notInclude(plain, "&#9;");
        assert.notInclude(plain, "> 0.87 <");
      }),
    ),
  );

  for (const name of usageCuts.flatMap((cut) => cut.negatives)) {
    it.effect(`usage negative ${name} differs from its positive usage3`, () =>
      inFreshRoot(() =>
        Effect.gen(function* usageNegativeDiffers() {
          const base = yield* treeDigest(yield* materialize("usage3"));

          assert.notDeepEqual(yield* treeDigest(yield* materialize(name)), base, name);
        }),
      ),
    );
  }

  it.effect("no packaging test names a cache or fixtures path literal", () =>
    Effect.gen(function* pathLiteralSweep() {
      const fs = yield* FileSystem.FileSystem;
      const forbidden = [["~/", ".cache"].join(""), ["work/", "fixtures"].join("")];
      const files = (yield* fs.readDirectory(sourceDirectory, { recursive: true })).filter(
        (file) => file.endsWith(".packaging.test.ts") || file === "package/zip.test.ts",
      );
      const hits: string[] = [];

      for (const file of files) {
        const text = yield* fs.readFileString(`${sourceDirectory}/${file}`);

        for (const literal of forbidden) {
          if (text.includes(literal)) {
            hits.push(`${file}: ${literal}`);
          }
        }
      }

      assert.deepStrictEqual(hits, []);
    }),
  );
});

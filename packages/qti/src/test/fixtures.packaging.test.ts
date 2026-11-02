import { createHash } from "node:crypto";
import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { ConfigProvider, Effect, FileSystem, Stream } from "effect";
import { ChildProcess, ChildProcessSpawner } from "effect/process";
import { readXml } from "#qti/xml/read.ts";
import type { Element } from "#qti/xml/tree.ts";
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
} from "#qti/test/fixtures.ts";
import type { FixtureName, FixtureSpec } from "#qti/test/fixtures.ts";

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

  it.effect("every metadata name is in the table and materializes under the hash it names", () =>
    inFreshRoot((root) =>
      Effect.gen(function* metadataPaths() {
        for (const name of metadataNames) {
          assert.include(fixtureNames, name);

          const spec = specOf(name);

          assert.strictEqual(spec.name, name);
          assert.strictEqual(spec.member, specOf("simple").member);
          assert.strictEqual(
            yield* materialize(name),
            `${root}/${name}-${transformHash(spec, FIXTURES_VERSION).slice(0, 12)}`,
          );
        }

        assert.strictEqual(new Set(fixtureNames).size, fixtureNames.length);
        assert.strictEqual(
          new Set(metadataNames.map((name) => transformHash(specOf(name), FIXTURES_VERSION))).size,
          metadataNames.length,
        );
      }),
    ),
  );

  it.effect("each metadata positive is a manifest with the resources and elements it adds", () =>
    inFreshRoot(() =>
      Effect.gen(function* metadataPositiveContents() {
        for (const cut of metadataCuts) {
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
        }
      }),
    ),
  );

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

  it.effect("extmeta's record is the published metadata with no xml:lang attribute", () =>
    inFreshRoot(() =>
      Effect.gen(function* externalRecord() {
        const fs = yield* FileSystem.FileSystem;
        const dir = yield* materialize("extmeta");
        const record = yield* fs.readFileString(`${dir}/meta/choice.xml`);

        assert.notInclude(record, "xml:lang");
        assert.include(record, "<string>jacs</string>");
        assert.include(record, "<string>Mathematics</string>");
        assert.isBelow(record.length, 2726);
        assert.deepStrictEqual(yield* filesUnder(dir), [
          "choice.xml",
          "images/sign.png",
          "imsmanifest.xml",
          "meta/choice.xml",
        ]);
      }),
    ),
  );

  it.effect("each metadata negative differs from its positive in the manifest or the record", () =>
    inFreshRoot(() =>
      Effect.gen(function* metadataNegativeDiffers() {
        for (const cut of metadataCuts) {
          const base = yield* manifestAndRecord(yield* materialize(cut.name));

          for (const name of cut.negatives) {
            const broken = yield* manifestAndRecord(yield* materialize(name));

            assert.notDeepEqual(broken, base, name);
          }
        }
      }),
    ),
  );

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

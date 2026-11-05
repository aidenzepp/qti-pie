import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { ConfigProvider, Effect, FileSystem } from "effect";
import { readXml } from "@qti-pie/crust/read.ts";
import { inject } from "vitest";
import {
  FIXTURES_VERSION,
  editBytes,
  fixtureNames,
  hash12,
  materialize,
  materializeCorpus,
  materializePackage,
  materializeSpec,
  negativeNames,
  specOf,
  transformHash,
} from "#pantry/test/fixtures.ts";
import type { Edit, FixtureName, FixtureSpec } from "#pantry/test/fixtures.ts";
import { readRows } from "#pantry/import/package.ts";
import { Rows } from "#pantry/import/tree.ts";
import { AttributeFileReference } from "#pantry/schema/reference.ts";
import { PackageEntry } from "#pantry/schema/package.ts";
import { settings as hostSettings } from "#pantry/test/settings.ts";

/**
 * The directory every test root is made under: the package's gitignored `work/`.
 */
const workDirectory = path.resolve(import.meta.dirname, "../../work");

/**
 * Run `use` against a fresh, empty fixtures root that exists only for the call.
 *
 * The root is a new directory under `work/`, handed to the materializer through
 * `ConfigProvider.fromUnknown` over the host environment (so `HOME`, which locates the
 * default tarball, still resolves), and removed when the call ends, whether it passed or
 * failed. Every test owns its root, so one test's truncated file or half-run race can never
 * be what another test reads.
 *
 * @param use - The test body; receives the root it must expect everything under.
 * @param settings - Further `Config` values for the call, such as `GR8DES_QTI_EXAMPLES`.
 * @returns The effect that creates the root, runs `use` and removes the root.
 */
const inFreshRoot = <A, E, R>(
  use: (root: string) => Effect.Effect<A, E, R>,
  settings: Record<string, string> = {},
) =>
  Effect.gen(function* useFreshRoot() {
    const fs = yield* FileSystem.FileSystem;

    yield* fs.makeDirectory(workDirectory, { recursive: true });

    const root = yield* fs.makeTempDirectoryScoped({
      directory: workDirectory,
      prefix: "fixtures-test-",
    });
    const config = ConfigProvider.layerAdd(
      ConfigProvider.fromUnknown({ ...settings, GR8DES_QTI_FIXTURES: root }),
      { asPrimary: true },
    );

    return yield* use(root).pipe(Effect.provide(config));
  }).pipe(Effect.scoped);

/**
 * The files `simple` holds once materialized, with the byte sizes the examples tarball gives them.
 */
const simpleFiles = [
  ["choice.xml", 1838],
  ["images/sign.png", 4029],
  ["imsmanifest.xml", 5215],
] as const;

/**
 * Read bytes the way the materializer's edits do, one character per byte.
 *
 * @param bytes - A file's bytes.
 * @returns The bytes as latin1 text.
 */
const latin1 = (bytes: Uint8Array): string => Buffer.from(bytes).toString("latin1");

/**
 * The seven variants of `simple`, in the order the spec table lists them.
 */
const variantNames = [
  "doctype",
  "latin1",
  "external",
  "utf16",
  "windows-1252",
  "padded-attributes",
  "padded-text",
] as const;

/**
 * The fixtures phase 1 itself defines: `simple`, its seven variants and the eleven hand-edited
 * packages (two of them admitted). Later phases append names to `fixtureNames`, so these are
 * checked as a subset.
 */
const phaseOneNames = [
  "simple",
  ...variantNames,
  "undeclared-response",
  "choice-in-prompt",
  "two-values-single",
  "bad-identifier-value",
  "padded-identifier-value",
  "choice-bounds",
  "identifier-mismatch",
  "title-mismatch",
  "body-empty",
  "comment-in-element",
  "bad-template-uri",
] as const satisfies readonly FixtureName[];

/**
 * Materialize a fixture under the current root and read one of its files.
 *
 * @param name - The fixture to materialize.
 * @param file - The file's path inside the package directory.
 * @returns The file's bytes.
 */
const readFixtureFile = Effect.fn("readFixtureFile")(function* readFixtureFile(
  name: FixtureName,
  file: string,
) {
  const fs = yield* FileSystem.FileSystem;
  const dir = yield* materialize(name);

  return yield* fs.readFile(`${dir}/${file}`);
});

/**
 * Split bytes read as latin1 into their CRLF-terminated lines.
 *
 * @param bytes - A file's bytes.
 * @returns The lines, so `lines[0]` is line 1 of the file.
 */
const linesOf = (bytes: Uint8Array): string[] => latin1(bytes).split("\r\n");

/**
 * Count the bytes of a file above 0x7F, which `simple` has none of.
 *
 * @param bytes - A file's bytes.
 * @returns How many bytes are not ASCII.
 */
const nonAsciiBytes = (bytes: Uint8Array): number =>
  bytes.reduce((count, byte) => count + (byte > 0x7f ? 1 : 0), 0);

/**
 * A spec the hash test changes one input of at a time.
 */
const baseSpec: FixtureSpec = { edits: [], member: "dir/one.zip", name: "one" };

/**
 * An edit list entry; its content only has to differ from the empty list.
 */
const someEdit: Edit = { _tag: "ReplaceText", file: "choice.xml", replacement: "b", search: "a" };

/**
 * The resources of a manifest, read with plain patterns: each resource's identifier, type and
 * `href`, and the `href` of every `file` it lists.
 *
 * @param manifest - A manifest's text.
 * @returns One entry per resource, in document order.
 */
const resourcesOf = (manifest: string) =>
  [...manifest.matchAll(/<resource\b(?<attrs>[^>]*)>(?<body>[\s\S]*?)<\/resource>/gu)].map(
    (match) => {
      const attribute = (name: string) =>
        new RegExp(`\\s${name}="(?<value>[^"]*)"`, "u").exec(match.groups?.["attrs"] ?? "")
          ?.groups?.["value"] ?? "";

      return {
        files: [...(match.groups?.["body"] ?? "").matchAll(/<file href="(?<href>[^"]*)"/gu)].map(
          (file) => file.groups?.["href"] ?? "",
        ),
        href: attribute("href"),
        identifier: attribute("identifier"),
        type: attribute("type"),
      };
    },
  );

/**
 * The `href` of each item ref of a test document, as written.
 *
 * @param test - A test document's text.
 * @returns The hrefs, in document order.
 */
const itemHrefsOf = (test: string): string[] =>
  [...test.matchAll(/<qti-assessment-item-ref\b[^>]*\shref="(?<href>[^"]*)"/gu)].map(
    (match) => match.groups?.["href"] ?? "",
  );

/**
 * Every path a materialized package holds, files only.
 *
 * @param dir - The package directory.
 * @returns The file paths, relative to `dir`.
 */
const filesOf = Effect.fn("filesOf")(function* filesOf(dir: string) {
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
 * Phase 5's eleven positive fixtures with the `schemaversion` each package's manifest declares.
 */
const positiveVersions: readonly (readonly [FixtureName, "3.0.0" | "3.0.1"])[] = [
  ["stimulus-301", "3.0.1"],
  ["stimulus-shared", "3.0.0"],
  ["test-adaptive", "3.0.0"],
  ["test-content", "3.0.0"],
  ["test-include", "3.0.0"],
  ["test-linear", "3.0.0"],
  ["test-lti", "3.0.1"],
  ["test-mapping", "3.0.0"],
  ["test-section-ref", "3.0.0"],
  ["test-selection", "3.0.0"],
  ["test-template-default", "3.0.0"],
];

/**
 * The namespace of every QTI document of either version.
 */
const qtiNamespace = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

/**
 * The 63 negative fixtures of phase 5, as a literal: the spec's 4.15 last column, less the corpus
 * packages and `stimulus-300-data` (phase 8's), plus `prefixed-ambiguous` (decision 189).
 */
const expectedNegativeNames = [
  "branch-backward",
  "branch-exit-misspelled",
  "branch-into-ref",
  "branch-part-to-item",
  "branch-replacement-target",
  "branch-unknown-target",
  "duration-of-item-ref",
  "feedback-outcome-float",
  "feedback-template",
  "include-text",
  "include-xpointer",
  "instance-spelling-canonical",
  "item-duration-in-item",
  "item-duration-not-timed",
  "item-in-section",
  "item-prefixed",
  "item-ref-missing",
  "item-ref-to-stimulus",
  "mapping-target-twice",
  "mapping-undeclared",
  "navigation-misspelled",
  "part-no-section",
  "part-order",
  "precondition-number-correct",
  "prefixed-ambiguous",
  "prefixed-undeclared-variable",
  "prefixed-unknown-ref",
  "rubric-empty-view",
  "rubric-in-rubric",
  "rubric-interaction",
  "rubric-no-body",
  "rubric-printed-undeclared",
  "section-adaptive-and-selection",
  "section-empty",
  "section-feedback-undeclared",
  "section-identifier-unknown",
  "section-prefixed-unresolved",
  "section-printed-undeclared",
  "section-ref-cycle",
  "section-ref-identifier-clash",
  "section-ref-to-item",
  "section-two-isc",
  "section-unprefixed-undeclared",
  "section-variable-in-test",
  "select-not-integer",
  "select-over",
  "select-under-required",
  "stimulus-300-attributes",
  "stimulus-300-include",
  "stimulus-body-empty",
  "stimulus-missing-image",
  "stimulus-ref-duplicate",
  "stimulus-ref-to-item",
  "stimulus-typed-test",
  "template-default-type",
  "template-default-undeclared",
  "test-declares-duration",
  "test-duplicate-identifier",
  "test-identifier-mismatch",
  "test-lang-no-lom",
  "test-no-part",
  "test-title-mismatch",
  "test-undeclared-variable",
] as const;

/**
 * For each non-direct negative that adds text, a file of its package and the text its breach put
 * there.
 */
const negativeBreaches: readonly (readonly [FixtureName, string, string])[] = [
  ["branch-backward", "rtest13.xml", 'target="item034"'],
  ["branch-exit-misspelled", "rtest13.xml", 'target="EXIT_TESTS"'],
  ["branch-into-ref", "rtest01.xml", 'target="shared"'],
  ["branch-part-to-item", "rtest13.xml", 'target="item653"'],
  ["branch-replacement-target", "rtest12.xml", 'target="item063"'],
  ["branch-unknown-target", "rtest13.xml", 'target="NOPE"'],
  ["feedback-outcome-float", "assessment.xml", 'identifier="PROGRESS"'],
  ["feedback-template", "assessment.xml", "<qti-template-inline"],
  ["include-text", "rtest01.xml", 'parse="text"'],
  ["include-xpointer", "rtest01.xml", 'xpointer="element(/1)"'],
  ["item-in-section", "rtest13.xml", '<qti-assessment-item identifier="inline"'],
  ["item-ref-missing", "rtest13.xml", 'href="missing.xml"'],
  ["item-ref-to-stimulus", "stimulus-test.xml", 'href="passages/unbelievableNight.xml"'],
  ["mapping-target-twice", "rtest26.xml", 'source-identifier="NOTB" target-identifier="SCORE"'],
  ["mapping-undeclared", "rtest26.xml", 'source-identifier="NOPE"'],
  ["navigation-misspelled", "rtest13.xml", 'navigation-mode="Linear"'],
  ["part-no-section", "rtest13.xml", 'identifier="RTEST-13-B" navigation-mode="linear"'],
  ["precondition-number-correct", "rtest13.xml", "<qti-number-correct/>"],
  ["prefixed-ambiguous", "rtest26.xml", 'source-identifier="K.SCORE"'],
  ["prefixed-undeclared-variable", "rtest26.xml", '<qti-variable identifier="I.NOPE"/>'],
  ["prefixed-unknown-ref", "rtest26.xml", '<qti-variable identifier="NOPE.SCORE"/>'],
  ["rubric-empty-view", "assessment.xml", 'view=""'],
  ["rubric-in-rubric", "assessment.xml", "<p>Nested</p>"],
  ["rubric-interaction", "assessment.xml", "<qti-text-entry-interaction"],
  ["rubric-printed-undeclared", "assessment.xml", '<qti-printed-variable identifier="NOPE"/>'],
  ["section-adaptive-and-selection", "adaptive-test.xml", '<qti-selection select="1"/>'],
  ["section-empty", "rtest13.xml", 'identifier="bare"'],
  ["section-identifier-unknown", "rtest26.xml", 'section-identifier="NOPE"'],
  ["section-prefixed-unresolved", "test-b.xml", 'identifier="RENAMED"'],
  ["section-ref-cycle", "sections/shared.xml", 'href="shared.xml"'],
  [
    "section-ref-identifier-clash",
    "sections/shared.xml",
    '<qti-assessment-item-ref identifier="ITEMREF"',
  ],
  ["section-ref-to-item", "rtest01.xml", 'href="items/i2.xml"'],
  ["section-two-isc", "rtest13.xml", 'max-attempts="3"'],
  ["select-not-integer", "rtest12.xml", 'select="2.5"'],
  ["select-over", "rtest12.xml", 'select="9"'],
  [
    "select-under-required",
    "rtest12.xml",
    'identifier="item434" href="item434.xml" required="true"',
  ],
  ["stimulus-300-attributes", "passages/unbelievableNight.xml", '<qti-stimulus-body class="x">'],
  ["stimulus-300-include", "passages/unbelievableNight.xml", "<xi:include"],
  [
    "stimulus-body-empty",
    "passages/unbelievableNight.xml",
    "<qti-stimulus-body> </qti-stimulus-body>",
  ],
  ["stimulus-ref-to-item", "exemplar06.xml", 'href="exemplar04.xml"'],
  ["stimulus-typed-test", "imsmanifest.xml", 'identifier="Stimulus1" type="imsqti_test_xmlv3p0"'],
  ["template-default-type", "template-default-test.xml", 'base-type="string">fast'],
  ["template-default-undeclared", "template-default-test.xml", 'template-identifier="NOPE"'],
  ["test-declares-duration", "rtest13.xml", 'identifier="duration"'],
  ["test-duplicate-identifier", "rtest13.xml", 'identifier="sectionA" href="item160.xml"'],
  ["test-identifier-mismatch", "imsmanifest.xml", "<imsmd:entry>OTHER-TEST</imsmd:entry>"],
  ["test-title-mismatch", "imsmanifest.xml", "Another Test</imsmd:string>"],
  ["test-undeclared-variable", "rtest13.xml", '<qti-variable identifier="NOPE"/>'],
];

/**
 * For each negative that removes text, a file of its package and the text its breach took out.
 */
const negativeRemovals: readonly (readonly [FixtureName, string, string])[] = [
  ["rubric-no-body", "assessment.xml", "<p>Test instructions</p>"],
  ["section-feedback-undeclared", "test-b.xml", 'identifier="FLAG"'],
  ["section-printed-undeclared", "test-b.xml", 'identifier="COUNT"'],
  ["section-unprefixed-undeclared", "test-b.xml", 'identifier="SCORE"'],
  [
    "test-lang-no-lom",
    "imsmanifest.xml",
    "<imsmd:general>\n                        <imsmd:language>",
  ],
];

/**
 * The paths a manifest lists as `file`s, each once.
 *
 * @param manifest - A manifest's text.
 * @returns The listed paths, sorted.
 */
const listedFilesOf = (manifest: string): string[] =>
  [
    ...new Set(
      [...manifest.matchAll(/<file href="(?<href>[^"]*)"/gu)].map(
        (match) => match.groups?.["href"] ?? "",
      ),
    ),
  ].toSorted();

/**
 * BegGuide's test, cut with the documents it reaches.
 */
const begGuideCut: FixtureSpec = {
  edits: [{ _tag: "cutTest", schemaversion: "3.0.1", test: "BGtest.xml" }],
  member: "QTI3_BeginnersGuide_Examples/BegGuide_March2025.zip",
  name: "cut-test-begguide",
};

/**
 * The corpus's loose `rtest13.xml`, packaged with one generated stub item per item `href`.
 */
const looseRtest13: FixtureSpec = {
  edits: [
    {
      _tag: "looseTest",
      schemaversion: "3.0.0",
      test: "qtiv3-examples/tests/rtest13.xml",
    },
  ],
  member: "qtiv3-examples/tests/rtest13.xml",
  name: "loose-test-rtest13",
};

layer(NodeServices.layer, { excludeTestServices: true })("test/fixtures.ts", (it) => {
  it.effect("the globalSetup provides the base set before the file's own first materialize", () =>
    Effect.gen(function* providedBaseSet() {
      const fs = yield* FileSystem.FileSystem;
      const fixtures = inject("fixtures");

      assert.notStrictEqual(fixtures, undefined, "vitest never ran the package's globalSetup");
      assert.deepStrictEqual(Object.keys(fixtures).toSorted(), [
        "CAT_Test01_Adaptive_EchoAdapt",
        "lti",
        "metaData",
        "sample_pci",
        "simple",
      ]);

      for (const [name, dir] of Object.entries(fixtures)) {
        assert.strictEqual(yield* fs.exists(dir), true, `${name}: ${dir}`);
      }
    }),
  );

  it.effect(
    "two concurrent materializations of simple leave one directory and no temporary sibling",
    () =>
      inFreshRoot((root) =>
        Effect.gen(function* concurrentCalls() {
          const fs = yield* FileSystem.FileSystem;
          const [first, second] = yield* Effect.all(
            [materialize("simple"), materialize("simple")],
            {
              concurrency: "unbounded",
            },
          );
          const entries = yield* fs.readDirectory(root);
          const listing = yield* fs.readDirectory(first, { recursive: true });

          assert.strictEqual(first, second);
          assert.strictEqual(entries.filter((entry) => entry.startsWith("simple-")).length, 1);
          assert.deepStrictEqual(
            entries.filter((entry) => entry.startsWith(".tmp-")),
            [],
          );
          assert.deepStrictEqual(listing.toSorted(), [
            "choice.xml",
            "images",
            "images/sign.png",
            "imsmanifest.xml",
          ]);

          for (const [file, size] of simpleFiles) {
            assert.strictEqual((yield* fs.readFile(`${first}/${file}`)).length, size, file);
          }
        }),
      ),
  );

  it.effect("a second call returns a present directory and rewrites nothing in it", () =>
    inFreshRoot(() =>
      Effect.gen(function* noRewrite() {
        const fs = yield* FileSystem.FileSystem;
        const first = yield* materialize("simple");

        yield* fs.writeFile(`${first}/choice.xml`, new Uint8Array());

        const second = yield* materialize("simple");

        assert.strictEqual(second, first);
        assert.strictEqual((yield* fs.readFile(`${second}/choice.xml`)).length, 0);
      }),
    ),
  );

  it.effect("a missing tarball fails as ExamplesError and leaves nothing under the root", () =>
    inFreshRoot(
      (root) =>
        Effect.gen(function* missingTarball() {
          const fs = yield* FileSystem.FileSystem;
          const failure = yield* materialize("simple").pipe(
            Effect.flip,
            Effect.map((error) => (error._tag === "ExamplesError" ? error.step : error._tag)),
          );

          assert.strictEqual(failure, "missing");
          assert.deepStrictEqual(yield* fs.readDirectory(root), []);
        }),
      { GR8DES_QTI_EXAMPLES: `${workDirectory}/absent-examples.tar.gz` },
    ),
  );

  it.effect(
    "transformHash is a pure function of the name, the member, the edits and the version",
    () =>
      Effect.sync(() => {
        const hash = transformHash(baseSpec, "1");

        assert.match(hash, /^[0-9a-f]{64}$/u);
        assert.strictEqual(transformHash({ ...baseSpec }, "1"), hash);
        assert.notStrictEqual(transformHash({ ...baseSpec, edits: [someEdit] }, "1"), hash);
        assert.notStrictEqual(transformHash(baseSpec, "2"), hash);
        assert.notStrictEqual(transformHash({ ...baseSpec, name: "two" }, "1"), hash);
        assert.notStrictEqual(transformHash({ ...baseSpec, member: "dir/two.zip" }, "1"), hash);
        assert.strictEqual(
          hash12(baseSpec),
          transformHash(baseSpec, FIXTURES_VERSION).slice(0, 12),
        );
      }),
  );

  it.effect("materialize names its directory by the hash of the spec it reads", () =>
    inFreshRoot((root) =>
      Effect.gen(function* namedByHash() {
        const dir = yield* materialize("simple");

        assert.strictEqual(dir, `${root}/simple-${hash12(specOf("simple"))}`);
      }),
    ),
  );

  it.effect(
    "materializePackage returns a directory named by its package that holds a manifest",
    () =>
      inFreshRoot((root) =>
        Effect.gen(function* refusedPackage() {
          const fs = yield* FileSystem.FileSystem;
          const dir = yield* materializePackage("metaData");

          assert.match(dir, /\/metaData-[0-9a-f]{12}$/u);
          assert.strictEqual(dir.startsWith(`${root}/`), true);
          assert.strictEqual(yield* fs.exists(`${dir}/imsmanifest.xml`), true);
        }),
      ),
  );

  it.effect.skipIf(!hostSettings.corpusRequested)(
    "materializeCorpus returns the 28 packages of the examples tarball holding 380 XML files",
    () =>
      inFreshRoot(() =>
        Effect.gen(function* corpus() {
          const fs = yield* FileSystem.FileSystem;
          const packages = yield* materializeCorpus();
          const xmlCounts = yield* Effect.forEach(
            packages,
            ({ dir }) =>
              fs
                .readDirectory(dir, { recursive: true })
                .pipe(
                  Effect.map((entries) => entries.filter((entry) => entry.endsWith(".xml")).length),
                ),
            { concurrency: 4 },
          );

          assert.strictEqual(packages.length, 28);
          assert.strictEqual(new Set(packages.map(({ name }) => name)).size, 28);
          assert.strictEqual(
            xmlCounts.reduce((total, count) => total + count, 0),
            380,
          );
        }),
      ),
    120_000,
  );

  it.effect(
    "editBytes replaces once, inserts after a CRLF line, and re-encodes as UTF-16 with a byte order mark",
    () =>
      Effect.sync(() => {
        const original = Buffer.from("a=1\r\nb=2\r\n", "latin1");
        assert.strictEqual(
          latin1(
            editBytes(original, [
              { _tag: "ReplaceText", file: "f", replacement: "b=\u0085", search: "b=2" },
            ]),
          ),
          "a=1\r\nb=\u0085\r\n",
        );
        assert.strictEqual(
          latin1(
            editBytes(original, [{ _tag: "InsertAfterLine", file: "f", line: 1, text: "x=0" }]),
          ),
          "a=1\r\nx=0\r\nb=2\r\n",
        );
        assert.deepStrictEqual(
          [...editBytes(Buffer.from("ab", "latin1"), [{ _tag: "EncodeUtf16", file: "f" }])],
          [0xff, 0xfe, 0x61, 0x00, 0x62, 0x00],
        );
        assert.throws(() => {
          editBytes(original, [
            { _tag: "ReplaceText", file: "f", replacement: "", search: "absent" },
          ]);
        });
        assert.throws(() => {
          editBytes(original, [{ _tag: "ReplaceText", file: "f", replacement: "", search: "=" }]);
        });
      }),
  );

  it.effect(
    "every fixture name has its own spec and hash, and phase 1's fixtures are present as variants of simple",
    () =>
      Effect.sync(() => {
        assert.strictEqual(new Set(fixtureNames).size, fixtureNames.length);

        for (const name of fixtureNames) {
          assert.strictEqual(specOf(name).name, name);
        }

        assert.strictEqual(
          new Set(fixtureNames.map((name) => hash12(specOf(name)))).size,
          fixtureNames.length,
        );
        assert.includeMembers([...fixtureNames], [...phaseOneNames]);

        for (const name of phaseOneNames) {
          assert.strictEqual(specOf(name).member, specOf("simple").member);
        }

        assert.deepStrictEqual(specOf("simple").edits, []);
      }),
  );

  it.effect("every variant materializes beside the others under its own hashed name", () =>
    inFreshRoot((root) =>
      Effect.gen(function* allVariants() {
        const fs = yield* FileSystem.FileSystem;
        const dirs = yield* Effect.all(variantNames.map((name) => materialize(name)));

        assert.deepStrictEqual(
          dirs,
          variantNames.map((name) => `${root}/${name}-${hash12(specOf(name))}`),
        );

        for (const dir of dirs) {
          assert.strictEqual(
            (yield* fs.readFile(`${dir}/images/sign.png`)).length,
            4029,
            `${dir}: sign.png`,
          );
        }

        for (const dir of dirs.filter((entry) => !entry.includes("/padded-text-"))) {
          assert.strictEqual(
            (yield* fs.readFile(`${dir}/imsmanifest.xml`)).length,
            5215,
            `${dir}: imsmanifest.xml`,
          );
        }
      }),
    ),
  );

  it.effect("the variants' Spanish image resolves to a file the package holds", () =>
    inFreshRoot(() =>
      Effect.gen(function* variantImages() {
        for (const name of [
          "variant",
          "variant-padded",
          "variant-no-resource",
          "variant-no-metadata",
        ] as const) {
          const { rows } = yield* readRows(yield* materialize(name));
          const references = Rows.of(rows, AttributeFileReference);
          const entries = Rows.of(rows, PackageEntry);

          assert.isAtLeast(references.length, 1, `${name}: file references`);

          for (const reference of references) {
            assert.isTrue(
              entries.some(
                (entry) => entry.package === reference.package && entry.path === reference.path,
              ),
              `${name}: ${reference.path} is a package entry`,
            );
          }
        }
      }),
    ),
  );

  it.effect("the media fixtures' referenced files are entries of their package", () =>
    inFreshRoot(() =>
      Effect.gen(function* mediaFiles() {
        for (const name of ["html-audio", "html-param", "controls-3-0-0"] as const) {
          const { rows } = yield* readRows(yield* materialize(name));
          const references = Rows.of(rows, AttributeFileReference);
          const entries = Rows.of(rows, PackageEntry);

          assert.isAtLeast(references.length, 1, `${name}: file references`);

          for (const reference of references) {
            assert.isTrue(
              entries.some(
                (entry) => entry.package === reference.package && entry.path === reference.path,
              ),
              `${name}: ${reference.path} is a package entry`,
            );
          }
        }
      }),
    ),
  );

  it.effect("cut-drawing keeps the file its srcset names, and its references resolve", () =>
    inFreshRoot(() =>
      Effect.gen(function* cutDrawing() {
        const fs = yield* FileSystem.FileSystem;
        const dir = yield* materialize("cut-drawing");

        assert.isTrue(yield* fs.exists(`${dir}/items/images/anglePQR.svg`), "anglePQR.svg kept");
        assert.include(
          yield* fs.readFileString(`${dir}/imsmanifest.xml`),
          "items/images/anglePQR.svg",
          "manifest lists anglePQR.svg",
        );

        const { rows } = yield* readRows(dir);
        const references = Rows.of(rows, AttributeFileReference);
        const entries = Rows.of(rows, PackageEntry);

        assert.isAtLeast(references.length, 1, "file references");

        for (const reference of references) {
          assert.isTrue(
            entries.some(
              (entry) => entry.package === reference.package && entry.path === reference.path,
            ),
            `${reference.path} is a package entry`,
          );
        }
      }),
    ),
  );

  it.effect("doctype declares a general entity and an ATTLIST default and uses the entity", () =>
    inFreshRoot(() =>
      Effect.gen(function* doctypeVariant() {
        const lines = linesOf(yield* readFixtureFile("doctype", "choice.xml"));

        assert.strictEqual(lines[0], '<?xml version="1.0" encoding="UTF-8"?>');
        assert.strictEqual(
          lines[1],
          '<!DOCTYPE qti-assessment-item [<!ENTITY org "1EdTech &amp; friends"><!ATTLIST qti-assessment-item adaptive CDATA "false">]>',
        );
        assert.strictEqual(lines[3]?.includes(' adaptive="false"'), false);
        assert.strictEqual(lines[3]?.includes(' time-dependent="false">'), true);
        assert.strictEqual(
          lines[20],
          "            <qti-prompt>What does it say? &org;</qti-prompt>",
        );
      }),
    ),
  );

  it.effect(
    "latin1 declares ISO-8859-1 and holds the one byte 0x85 and a character reference",
    () =>
      inFreshRoot(() =>
        Effect.gen(function* latin1Variant() {
          const bytes = yield* readFixtureFile("latin1", "choice.xml");
          const lines = linesOf(bytes);

          assert.strictEqual(lines[0], '<?xml version="1.0" encoding="ISO-8859-1"?>');
          assert.strictEqual(nonAsciiBytes(bytes), 1);
          assert.strictEqual(bytes.includes(0x85), true);
          assert.strictEqual(lines[14], "        <p>Look at the text in the picture.\u0085</p>");
          assert.strictEqual(
            lines[16],
            '            <img src="images/sign.png" alt="NEVER LEAVE LUGGAGE &#x20AC;"/>',
          );
        }),
      ),
  );

  it.effect("external declares an external subset and refers to two undeclared entities", () =>
    inFreshRoot(() =>
      Effect.gen(function* externalVariant() {
        const fs = yield* FileSystem.FileSystem;
        const dir = yield* materialize("external");
        const bytes = yield* fs.readFile(`${dir}/choice.xml`);
        const lines = linesOf(bytes);

        assert.strictEqual(lines[1], '<!DOCTYPE qti-assessment-item SYSTEM "item.dtd">');
        assert.strictEqual(latin1(bytes).split("&undeclared;").length - 1, 2);
        assert.strictEqual(
          lines[20],
          "            <qti-prompt>What does it say? &undeclared;</qti-prompt>",
        );
        assert.strictEqual(
          lines[17],
          '            <img src="images/sign.png" alt="NEVER LEAVE LUGGAGE &undeclared;"/>',
        );
        assert.strictEqual(yield* fs.exists(`${dir}/item.dtd`), false);
      }),
    ),
  );

  it.effect("utf16 is a byte order mark FF FE and the whole text as UTF-16 little endian", () =>
    inFreshRoot(() =>
      Effect.gen(function* utf16Variant() {
        const bytes = yield* readFixtureFile("utf16", "choice.xml");
        const text = new TextDecoder("utf-16le").decode(bytes.subarray(2));

        assert.deepStrictEqual([...bytes.subarray(0, 2)], [0xff, 0xfe]);
        assert.strictEqual(text.startsWith('<?xml version="1.0" encoding="UTF-16"?>\r\n'), true);
        assert.strictEqual(text.includes("<qti-assessment-item "), true);
        assert.strictEqual(text.length * 2 + 2, bytes.length);
      }),
    ),
  );

  it.effect("windows-1252 declares its encoding and holds the one byte 0x80", () =>
    inFreshRoot(() =>
      Effect.gen(function* windows1252Variant() {
        const bytes = yield* readFixtureFile("windows-1252", "choice.xml");
        const lines = linesOf(bytes);

        assert.strictEqual(lines[0], '<?xml version="1.0" encoding="windows-1252"?>');
        assert.strictEqual(nonAsciiBytes(bytes), 1);
        assert.strictEqual(bytes.includes(0x80), true);
        assert.strictEqual(lines[14], "        <p>Look at the text in the picture.\u0080</p>");
      }),
    ),
  );

  it.effect("padded-attributes pads seven collapse-type values and puts a tab in two others", () =>
    inFreshRoot(() =>
      Effect.gen(function* paddedAttributesVariant() {
        const lines = linesOf(yield* readFixtureFile("padded-attributes", "choice.xml"));
        const expected = [
          [2, 'identifier=" choice "'],
          [2, 'title="Unattended&#9;Luggage"'],
          [2, 'adaptive=" false "'],
          [16, 'src=" images/sign.png "'],
          [16, 'alt="NEVER&#9;LEAVE LUGGAGE UNATTENDED"'],
          [18, 'response-identifier=" RESPONSE "'],
          [18, 'max-choices=" 1 "'],
          [20, 'identifier=" ChoiceA "'],
          [
            25,
            'template=" https://www.imsglobal.org/question/qti_v3p0/rptemplates/match_correct.xml "',
          ],
        ] as const;

        for (const [index, snippet] of expected) {
          assert.strictEqual(
            lines[index]?.includes(snippet),
            true,
            `line ${index + 1}: ${snippet}`,
          );
        }

        assert.strictEqual(lines.length, 27);
      }),
    ),
  );

  it.effect(
    "padded-text pads a collapse leaf and adds a replace leaf holding a tab and a line feed",
    () =>
      inFreshRoot(() =>
        Effect.gen(function* paddedTextVariant() {
          const manifest = linesOf(yield* readFixtureFile("padded-text", "imsmanifest.xml"));
          const choice = linesOf(yield* readFixtureFile("padded-text", "choice.xml"));

          assert.strictEqual(
            manifest[53],
            "                    <imsqti:timeDependent> false </imsqti:timeDependent>",
          );
          assert.strictEqual(choice[12], "    </qti-outcome-declaration>");
          assert.strictEqual(
            choice[13],
            '<qti-outcome-declaration identifier="NOTE" cardinality="single" base-type="string"><qti-default-value><qti-value>a&#9;b&#10;c</qti-value></qti-default-value></qti-outcome-declaration>',
          );
          assert.strictEqual(choice[14], "    <qti-item-body>");
        }),
      ),
  );
  it.effect(
    "cutTest keeps the test, its six items and the four media files, each listed once",
    () =>
      inFreshRoot(() =>
        Effect.gen(function* cutTestPackage() {
          const fs = yield* FileSystem.FileSystem;
          const dir = yield* materializeSpec(begGuideCut);
          const manifest = yield* fs.readFileString(`${dir}/imsmanifest.xml`);
          const test = yield* fs.readFileString(`${dir}/BGtest.xml`);
          const resources = resourcesOf(manifest);
          const files = yield* filesOf(dir);
          const listed = resources.flatMap((resource) => resource.files);

          assert.deepStrictEqual(
            resources.map((resource) => [resource.type, resource.href]),
            [
              ["imsqti_test_xmlv3p0", "BGtest.xml"],
              ["imsqti_item_xmlv3p0", "items/firstexample.xml"],
              ["imsqti_item_xmlv3p0", "items/BG007.xml"],
              ["imsqti_item_xmlv3p0", "items/BG008.xml"],
              ["imsqti_item_xmlv3p0", "items/BG009.xml"],
              ["imsqti_item_xmlv3p0", "items/BG010.xml"],
              ["imsqti_item_xmlv3p0", "items/BG011.xml"],
            ],
          );
          assert.strictEqual(new Set(resources.map((resource) => resource.identifier)).size, 7);
          assert.include(manifest, "<schemaversion>3.0.1</schemaversion>");

          for (const href of itemHrefsOf(test)) {
            assert.include(files, href);
          }

          assert.deepStrictEqual(
            resources.find((resource) => resource.href === "items/BG011.xml")?.files.toSorted(),
            [
              "items/BG011.xml",
              "items/resources/crow_movie.mp4",
              "items/resources/crow_movie.ogg",
              "items/resources/crows.jpg",
              "items/resources/subtitles_en.vtt",
            ],
          );
          assert.deepStrictEqual(
            files.filter((file) => file !== "imsmanifest.xml"),
            [...new Set(listed)].toSorted(),
          );
          assert.deepStrictEqual(
            files.toSorted(),
            [...new Set(listed), "imsmanifest.xml"].toSorted(),
          );
          assert.notInclude(files, "items/BG007.xml.bak");
        }),
      ),
  );

  it.effect("looseTest packages rtest13 with one stub per item href declaring its variables", () =>
    inFreshRoot(() =>
      Effect.gen(function* looseTestPackage() {
        const fs = yield* FileSystem.FileSystem;
        const dir = yield* materializeSpec(looseRtest13);
        const manifest = yield* fs.readFileString(`${dir}/imsmanifest.xml`);
        const test = yield* fs.readFileString(`${dir}/rtest13.xml`);
        const resources = resourcesOf(manifest);
        const files = yield* filesOf(dir);
        const hrefs = itemHrefsOf(test);

        assert.strictEqual(hrefs.length, 6);
        assert.deepStrictEqual(
          resources.map((resource) => [resource.type, resource.href]),
          [
            ["imsqti_test_xmlv3p0", "rtest13.xml"],
            ...hrefs.map((href) => ["imsqti_item_xmlv3p0", href]),
          ],
        );

        for (const href of hrefs) {
          assert.include(files, href);
        }

        assert.deepStrictEqual(
          files,
          [...resources.flatMap((resource) => resource.files), "imsmanifest.xml"]
            .filter((file, at, all) => all.indexOf(file) === at)
            .toSorted(),
        );

        const stub = yield* fs.readFileString(`${dir}/item034.xml`);

        assert.include(stub, 'identifier="item034"');
        assert.match(
          stub,
          /<qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier"/u,
        );
        assert.match(
          stub,
          /<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/u,
        );
        assert.notInclude(stub, "sign.png");
        assert.notInclude(stub, 'identifier="xml"');
      }),
    ),
  );
  it.effect(
    "each positive fixture of phase 5 lists every packaged file and holds QTI documents that parse",
    () =>
      inFreshRoot(() =>
        Effect.gen(function* positiveFixtures() {
          const fs = yield* FileSystem.FileSystem;

          for (const [name, version] of positiveVersions) {
            const dir = yield* materialize(name);
            const files = yield* filesOf(dir);
            const manifest = yield* fs.readFileString(`${dir}/imsmanifest.xml`);

            assert.include(manifest, `<schemaversion>${version}</schemaversion>`, name);
            assert.deepStrictEqual(
              files.filter((file) => file !== "imsmanifest.xml"),
              listedFilesOf(manifest),
              name,
            );

            for (const file of files) {
              const isDocument =
                file.endsWith(".xml") &&
                file !== "imsmanifest.xml" &&
                !file.startsWith("adaptive/") &&
                !file.startsWith("links/");

              if (isDocument) {
                const document = yield* readXml(yield* fs.readFile(`${dir}/${file}`));

                assert.strictEqual(document.root.namespace, qtiNamespace, `${name}/${file}`);
              }
            }
          }
        }),
      ),
    120_000,
  );

  it.effect("test-mapping's stubs: I is time-dependent with A.B, J declares no K.SCORE", () =>
    inFreshRoot(() =>
      Effect.gen(function* mappingStubs() {
        const fs = yield* FileSystem.FileSystem;
        const dir = yield* materialize("test-mapping");
        const test = yield* fs.readFileString(`${dir}/rtest26.xml`);
        const timed = yield* fs.readFileString(`${dir}/itemI.xml`);
        const shared = yield* fs.readFileString(`${dir}/itemJ.xml`);

        for (const identifier of ["J", "J.K"]) {
          assert.include(
            test,
            `<qti-assessment-item-ref identifier="${identifier}" href="itemJ.xml"/>`,
          );
        }

        assert.include(test, '<qti-variable identifier="J.K.SCORE"/>');
        assert.include(timed, 'time-dependent="true"');
        assert.include(timed, '<qti-variable identifier="duration"/>');
        assert.include(timed, 'identifier="A.B" cardinality="single" base-type="float"');
        assert.include(shared, 'time-dependent="false"');
        assert.include(shared, 'identifier="SCORE" cardinality="single" base-type="float"');
        assert.notInclude(shared, 'identifier="K.SCORE"');
        assert.notInclude(shared, 'identifier="K"');
      }),
    ),
  );

  it.effect(
    "test-section-ref has two tests reaching one section document and one that none reaches",
    () =>
      inFreshRoot(() =>
        Effect.gen(function* sectionRefs() {
          const fs = yield* FileSystem.FileSystem;
          const dir = yield* materialize("test-section-ref");
          const first = yield* fs.readFileString(`${dir}/rtest01.xml`);
          const second = yield* fs.readFileString(`${dir}/test-b.xml`);
          const manifest = yield* fs.readFileString(`${dir}/imsmanifest.xml`);
          const types = [...manifest.matchAll(/type="(?<type>[^"]*)"/gu)].map(
            (match) => match.groups?.["type"],
          );

          for (const test of [first, second]) {
            assert.include(test, 'href="sections/shared.xml"');
            assert.notInclude(test, "lonely");
          }

          assert.strictEqual(types.filter((type) => type === "imsqti_test_xmlv3p0").length, 2);
          assert.strictEqual(types.filter((type) => type === "imsqti_section_xmlv3p0").length, 2);
          assert.include(first, 'identifier="I2.SCORE"');
          assert.notInclude(second, 'identifier="I2.SCORE"');
          assert.include(second, '<qti-assessment-item-ref identifier="I2"');
        }),
      ),
  );

  it.effect("the 63 negative names are the spec's list, each in the fixture table", () =>
    Effect.sync(() => {
      assert.deepStrictEqual([...negativeNames], [...expectedNegativeNames]);
      assert.strictEqual(new Set(negativeNames).size, 63);
      assert.includeMembers([...fixtureNames], [...negativeNames]);

      for (const name of negativeNames) {
        assert.notInclude(
          positiveVersions.map(([positive]) => positive),
          name,
        );
      }
    }),
  );

  it.effect("only the four direct negatives carry a positive's edits unchanged", () =>
    Effect.sync(() => {
      const unchanged = negativeNames.filter((name) =>
        positiveVersions.some(
          ([positive]) =>
            JSON.stringify(specOf(positive).edits) === JSON.stringify(specOf(name).edits) &&
            specOf(positive).member === specOf(name).member,
        ),
      );

      assert.deepStrictEqual(
        [...unchanged],
        [
          "duration-of-item-ref",
          "instance-spelling-canonical",
          "item-prefixed",
          "section-variable-in-test",
        ],
      );
    }),
  );

  it.effect(
    "each negative fixture materializes, lists every packaged file and holds QTI documents that parse",
    () =>
      inFreshRoot(() =>
        Effect.gen(function* negativeFixtures() {
          const fs = yield* FileSystem.FileSystem;

          for (const name of negativeNames) {
            const dir = yield* materialize(name);
            const files = yield* filesOf(dir);
            const manifest = yield* fs.readFileString(`${dir}/imsmanifest.xml`);

            assert.deepStrictEqual(
              files.filter((file) => file !== "imsmanifest.xml"),
              listedFilesOf(manifest),
              name,
            );

            for (const file of files) {
              const isDocument =
                file.endsWith(".xml") &&
                file !== "imsmanifest.xml" &&
                !file.startsWith("adaptive/");

              if (isDocument) {
                const document = yield* readXml(yield* fs.readFile(`${dir}/${file}`));

                assert.strictEqual(document.root.namespace, qtiNamespace, `${name}/${file}`);
              }
            }
          }
        }),
      ),
    180_000,
  );

  it.effect(
    "each negative holds its breach in the file the spec's edit names",
    () =>
      inFreshRoot(() =>
        Effect.gen(function* breachesPresent() {
          const fs = yield* FileSystem.FileSystem;

          for (const [name, file, needle] of negativeBreaches) {
            const dir = yield* materialize(name);

            assert.include(yield* fs.readFileString(`${dir}/${file}`), needle, `${name}: ${file}`);
          }

          for (const [name, file, needle] of negativeRemovals) {
            const dir = yield* materialize(name);

            assert.notInclude(
              yield* fs.readFileString(`${dir}/${file}`),
              needle,
              `${name}: ${file}`,
            );
          }

          const twice = yield* fs.readFileString(
            `${yield* materialize("stimulus-ref-duplicate")}/exemplar06.xml`,
          );
          const part = yield* fs.readFileString(`${yield* materialize("part-order")}/rtest13.xml`);
          const images = yield* filesOf(yield* materialize("stimulus-missing-image"));
          const noPart = yield* fs.readFileString(
            `${yield* materialize("test-no-part")}/rtest13.xml`,
          );

          assert.strictEqual(
            twice.split('<qti-assessment-stimulus-ref identifier="Stimulus1"').length,
            3,
          );
          assert.isAbove(
            part.indexOf('<qti-item-session-control show-feedback="true"'),
            part.indexOf('<qti-assessment-section identifier="sectionA"'),
          );
          assert.notInclude(images, "passages/images/apip_VE_IP_05_croc.png");
          assert.notInclude(images, "passages/images/apip_VE_IP_05_flamingos.png");
          assert.notInclude(noPart, "<qti-test-part");
        }),
      ),
    180_000,
  );

  it.effect(
    "test-mapping's hand-written stubs: J untimed and naming duration, I untimed",
    () =>
      inFreshRoot(() =>
        Effect.gen(function* handStubs() {
          const fs = yield* FileSystem.FileSystem;
          const inItem = yield* fs.readFileString(
            `${yield* materialize("item-duration-in-item")}/itemJ.xml`,
          );
          const notTimed = yield* fs.readFileString(
            `${yield* materialize("item-duration-not-timed")}/itemI.xml`,
          );
          const ambiguous = yield* fs.readFileString(
            `${yield* materialize("prefixed-ambiguous")}/itemJ.xml`,
          );

          assert.include(inItem, 'time-dependent="false"');
          assert.include(inItem, '<qti-variable identifier="duration"/>');
          assert.include(notTimed, 'time-dependent="false"');
          assert.notInclude(notTimed, '<qti-variable identifier="duration"/>');
          assert.include(ambiguous, 'identifier="K.SCORE" cardinality="single" base-type="float"');
          assert.include(ambiguous, 'identifier="SCORE" cardinality="single" base-type="float"');
        }),
      ),
    60_000,
  );

  it.effect("extmeta's record keeps the two xml:lang attributes the published file carries", () =>
    inFreshRoot(() =>
      Effect.gen(function* externalRecordLang() {
        const fs = yield* FileSystem.FileSystem;
        const record = yield* fs.readFileString(`${yield* materialize("extmeta")}/meta/choice.xml`);

        assert.include(record, '<string xml:lang="en">jacs</string>');
        assert.include(record, '<string xml:lang="en">Mathematics</string>');
      }),
    ),
  );
});

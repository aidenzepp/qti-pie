import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { ConfigProvider, Effect, FileSystem } from "effect";
import { inject } from "vitest";
import {
  FIXTURES_VERSION,
  editBytes,
  fixtureNames,
  hash12,
  materialize,
  materializeCorpus,
  materializePackage,
  specOf,
  transformHash,
} from "#qti/test/fixtures.ts";
import type { Edit, FixtureName, FixtureSpec } from "#qti/test/fixtures.ts";
import { settings as hostSettings } from "#qti/test/settings.ts";

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
});

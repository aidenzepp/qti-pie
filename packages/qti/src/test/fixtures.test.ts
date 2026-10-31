import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { ConfigProvider, Effect, FileSystem } from "effect";
import {
  FIXTURES_VERSION,
  editBytes,
  hash12,
  materialize,
  materializeCorpus,
  materializePackage,
  specOf,
  transformHash,
} from "#qti/test/fixtures.ts";
import type { Edit, FixtureSpec } from "#qti/test/fixtures.ts";

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
 * A spec the hash test changes one input of at a time.
 */
const baseSpec: FixtureSpec = { edits: [], member: "dir/one.zip", name: "one" };

/**
 * An edit list entry; its content only has to differ from the empty list.
 */
const someEdit: Edit = { _tag: "ReplaceText", file: "choice.xml", replacement: "b", search: "a" };

layer(NodeServices.layer, { excludeTestServices: true })("test/fixtures.ts", (it) => {
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

  it.effect.skipIf(process.env["GR8DES_CORPUS"] !== "1")(
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
});

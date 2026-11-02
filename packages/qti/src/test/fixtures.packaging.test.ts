import { createHash } from "node:crypto";
import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { ConfigProvider, Effect, FileSystem, Stream } from "effect";
import { ChildProcess, ChildProcessSpawner } from "effect/process";
import {
  examplesTarball,
  materialize,
  materializePackage,
  materializeSpec,
  materializeZip,
} from "#qti/test/fixtures.ts";
import type { FixtureSpec } from "#qti/test/fixtures.ts";

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

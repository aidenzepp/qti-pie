import { existsSync } from "node:fs";
import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { ConfigProvider, Effect, FileSystem } from "effect";
import { examplesTarball, materialize, specOf } from "#pantry/test/fixtures.ts";
import type { FixtureName } from "#pantry/test/fixtures.ts";

/**
 * The directory every test root is made under: the package's gitignored `work/`.
 */
const workDirectory = path.resolve(import.meta.dirname, "../../work");

/**
 * Whether the examples tarball, which every wildcard fixture is cut from, is on this machine.
 */
const tarballPresent = existsSync(Effect.runSync(examplesTarball));

/**
 * What one wildcard fixture's materialized directory must hold: the item or manifest file that
 * carries its edit, and the text the edit leaves exactly once in it.
 */
interface Expectation {
  readonly name: FixtureName;
  readonly file: string;
  readonly marker: string;
}

const sineRule = "SineRule-001.xml";

const bgItem = "BG007.xml";

/**
 * The nine wildcard fixtures of phase 11 (spec W12), each with the one edit that makes it what it
 * is. The `cut-custom-operator` source is unedited, so its marker is the operator's own tag.
 */
const expectations: readonly Expectation[] = [
  { file: sineRule, marker: "<qti-custom-operator ", name: "cut-custom-operator" },
  { file: sineRule, marker: "<ma:extension ", name: "operator-foreign-content" },
  { file: bgItem, marker: "<xi:fallback", name: "fallback-3-0-1" },
  { file: "imsmanifest.xml", marker: 'xlink:foo="1"', name: "lom-wildcard" },
  { file: sineRule, marker: "<ma:first/>", name: "operator-foreign-first" },
  { file: sineRule, marker: "<qti-response-processing/>", name: "nested-root-in-foreign" },
  { file: sineRule, marker: ' foo="x"', name: "unqualified-on-operator" },
  { file: "imsmanifest.xml", marker: "<ma:ext ", name: "strict-file-foreign" },
  { file: sineRule, marker: "<qti-foo/>", name: "qti-ns-under-operator" },
];

/**
 * The text of the one file called `file` somewhere under `dir`.
 */
const readFileNamed = (dir: string, file: string) =>
  Effect.gen(function* readNamed() {
    const fs = yield* FileSystem.FileSystem;
    const entries = yield* fs.readDirectory(dir, { recursive: true });
    const found = entries.filter((entry) => entry === file || entry.endsWith(`/${file}`));

    assert.strictEqual(found.length, 1, `one ${file} under ${dir}`);

    return yield* fs.readFileString(`${dir}/${found[0] ?? ""}`);
  });

layer(NodeServices.layer, { excludeTestServices: true })(
  "test/fixtures.ts wildcard fixtures",
  (it) => {
    it.effect.skipIf(!tarballPresent)(
      "the nine wildcard fixtures materialize with each edit applied exactly once (skipped without the examples tarball)",
      () =>
        Effect.gen(function* nineFixtures() {
          const fs = yield* FileSystem.FileSystem;

          yield* fs.makeDirectory(workDirectory, { recursive: true });

          const root = yield* fs.makeTempDirectoryScoped({
            directory: workDirectory,
            prefix: "fixtures-foreign-",
          });
          const config = ConfigProvider.layerAdd(
            ConfigProvider.fromUnknown({ GR8DES_QTI_FIXTURES: root }),
            { asPrimary: true },
          );

          for (const { file, marker, name } of expectations) {
            const spec = specOf(name);

            assert.strictEqual(spec.name, name);

            const dir = yield* materialize(name).pipe(Effect.provide(config));
            const text = yield* readFileNamed(dir, file);

            assert.strictEqual(yield* fs.exists(dir), true, name);
            assert.strictEqual(text.split(marker).length - 1, 1, `${name}: ${marker}`);
          }

          assert.strictEqual(expectations.length, 9);
        }).pipe(Effect.scoped),
    );
  },
);

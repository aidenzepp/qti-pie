import { NodeFileSystem, NodePath } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, FileSystem, Layer } from "effect";
import { materializeCorpus } from "#qti/test/fixtures.ts";
import { canonicalize } from "@qti-pie/crust/canonical.ts";
import { OracleLayer, xmllintC14n } from "#qti/xml/oracle.ts";
import { readXml } from "@qti-pie/crust/read.ts";

/**
 * Whether the operator asked for the corpus run: it reads 28 packages and spawns `xmllint` once
 * per file, so it runs only on request.
 */
const requested = process.env["GR8DES_CORPUS"] === "1";

/**
 * The two files C14N refuses, each as a package name and a path inside that package's directory.
 * They carry relative namespace URIs (`docs/research/2f7d8fc3.md`, section 2). The directories are
 * hash-named, so a path relative to the fixture root cannot name them.
 */
const excluded: readonly (readonly [pkg: string, path: string])[] = [
  ["lti", "links/streaming_video_experiment101.xml"],
  ["testWithLti", "links/periodicTable.xml"],
];

/**
 * What every test here runs on: the process spawner `xmllintC14n` needs and the file system and
 * path services that spawner and the fixture materializer need.
 */
const TestLayer = OracleLayer.pipe(
  Layer.provideMerge(Layer.mergeAll(NodeFileSystem.layer, NodePath.layer)),
);

/**
 * The offset of the first byte at which two byte arrays differ.
 *
 * @param a - One byte array.
 * @param b - The other.
 * @returns The first index where they differ, or the shorter length when one is a prefix.
 */
const firstDifference = (a: Uint8Array, b: Uint8Array): number => {
  const shared = Math.min(a.length, b.length);
  let index = 0;

  while (index < shared && a[index] === b[index]) {
    index += 1;
  }

  return index;
};

layer(TestLayer)("xml/canonical.ts over the corpus", (it) => {
  it.effect.skipIf(!requested)(
    "every corpus XML file canonicalizes to the oracle's bytes",
    () =>
      Effect.gen(function* corpus() {
        const fs = yield* FileSystem.FileSystem;
        const packages = yield* materializeCorpus();
        const skipped = new Set(excluded.map(([pkg, path]) => `${pkg}\u0000${path}`));
        const disagreements: string[] = [];
        let compared = 0;
        let seen = 0;

        for (const { dir, name } of packages) {
          const entries = yield* fs.readDirectory(dir, { recursive: true });
          const files = entries.filter((entry) => entry.endsWith(".xml")).toSorted();

          for (const file of files) {
            seen += 1;
            if (skipped.has(`${name}\u0000${file}`)) {
              continue;
            }

            compared += 1;
            const path = `${dir}/${file}`;
            const outcome = yield* Effect.gen(function* compare() {
              const actual = canonicalize(yield* readXml(yield* fs.readFile(path)));
              const expected = yield* xmllintC14n(path);

              return firstDifference(actual, expected) === actual.length &&
                actual.length === expected.length
                ? undefined
                : `${name}/${file}: first differing byte offset ${firstDifference(actual, expected)}`;
            }).pipe(Effect.catch((error) => Effect.succeed(`${name}/${file}: ${String(error)}`)));

            if (outcome !== undefined) {
              disagreements.push(outcome);
            }
          }
        }

        console.log(
          `compared: ${compared}, excluded: ${excluded.map(([pkg, path]) => `${pkg}/${path}`).join(" ")}`,
        );
        console.log(`seen: ${seen}, packages: ${packages.length}`);
        for (const line of disagreements) {
          console.log(`disagreement ${line}`);
        }

        assert.deepStrictEqual(disagreements, []);
      }),
    { timeout: 600_000 },
  );
});

/**
 * The import's read (`#pantry/import/read.ts` `readPackage`), on the host: one package value holds
 * every entry once, as the raw read gives it, read from the file system once each, and exactly the
 * paths the import's reference rows name, and the import's build (`programOf`) reads nothing more.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, FileSystem, Ref } from "effect";
import { inject } from "vitest";
import { programOf } from "#pantry/import/program.ts";
import { readPackage } from "#pantry/import/read.ts";
import type { QtiPackage } from "#pantry/import/read.ts";
import { packageNameOf } from "#pantry/import/record.ts";
import { readEntries } from "#pantry/package/read.ts";
import { everyRelationPackage, scopedPackage } from "#pantry/test/gen/every-relation.ts";

const fixtures = inject("fixtures");

/**
 * Read a package as `readPackage` does, counting each file the file system reads, by its path
 * relative to the package directory.
 *
 * @param dir - The package directory.
 * @returns The package, and how many times each file was read.
 */
const readCounted = Effect.fn("test.read.counted")(function* readCounted(dir: string) {
  const fs = yield* FileSystem.FileSystem;
  const reads = yield* Ref.make(new Map<string, number>());
  const counting: FileSystem.FileSystem = {
    ...fs,
    readFile: (path) =>
      Effect.andThen(
        Ref.update(reads, (held) => {
          const at = path.slice(dir.length + 1);

          return new Map([...held, [at, (held.get(at) ?? 0) + 1]]);
        }),
        fs.readFile(path),
      ),
  };
  const pkg = yield* readPackage(dir).pipe(Effect.provideService(FileSystem.FileSystem, counting));

  return { pkg, reads: yield* Ref.get(reads) };
});

/**
 * The paths a program built from a package writes a reference row of, `ReferencePath` and
 * `TextReferencePath` alike, each once, sorted.
 *
 * @param pkg - The package.
 * @returns The paths.
 */
const writtenPathsOf = Effect.fn("test.read.writtenPaths")(function* writtenPathsOf(
  pkg: QtiPackage,
) {
  const { inputs } = yield* programOf(pkg);

  return [
    ...new Set(
      [...inputs.ReferencePath.values(), ...inputs.TextReferencePath.values()].map(
        ({ path }) => path,
      ),
    ),
  ].toSorted();
});

layer(NodeServices.layer, { excludeTestServices: true })("readPackage", (suite) => {
  suite.effect(
    "holds every entry once, read once, with its bytes, and exactly the paths the import's references resolve to",
    () =>
      // Oracle: two second implementations: the raw read (`readEntries`) for the files, their
      // order and their bytes, and the rows the import builds from the value (`programOf`) for
      // the referenced paths; and the file system's own count of reads. Live: the every-relation
      // package resolves references of both censuses, and `simple` fetches media. Bound: those two
      // packages.
      Effect.scoped(
        Effect.gen(function* holdsEveryEntry() {
          const dirs = [
            fixtures.simple,
            yield* scopedPackage(everyRelationPackage({ choices: 2, hotspots: 1, hottexts: 1 })),
          ];
          for (const dir of dirs) {
            const { pkg, reads } = yield* readCounted(dir);
            const entries = yield* readEntries(dir);

            assert.deepStrictEqual(
              [...pkg.files.keys()],
              entries.map(({ path }) => path),
              dir,
            );
            assert.deepStrictEqual(
              [...reads.entries()].toSorted(([x], [y]) => (x < y ? -1 : 1)),
              entries.map(({ path }) => [path, 1] as const),
              `${dir}: each file read once`,
            );

            const byPath = new Map<string, File>(pkg.files);
            for (const { bytes, path } of entries) {
              const file = byPath.get(path);

              assert.isDefined(file, path);
              assert.strictEqual(file?.name, path);
              assert.strictEqual(file?.type, "");
              assert.deepStrictEqual(
                yield* Effect.promise(() => file?.bytes() ?? Promise.resolve(new Uint8Array())),
                Uint8Array.from(bytes),
                path,
              );
            }

            assert.strictEqual(pkg.manifest.path, "imsmanifest.xml");
            assert.strictEqual(pkg.manifest.documentType, "manifest");
            assert.isFalse(pkg.documents.some(({ path }) => path === pkg.manifest.path));
            assert.isNotEmpty(pkg.documents, dir);
            assert.strictEqual(pkg.name, packageNameOf(dir));

            const written = yield* writtenPathsOf(pkg);

            assert.isNotEmpty(written, `${dir} resolves a reference in the package`);
            assert.deepStrictEqual([...pkg.referenced].toSorted(), written, dir);
          }
        }),
      ),
  );

  suite.effect("builds each program of one package value with its own ids", () =>
    // Oracle: the specification as a checker, "the same package imported twice is two packages":
    // two builds of one value share no package id and write the same paths. Bound: `simple`.
    Effect.gen(function* buildsTwice() {
      const pkg = yield* readPackage(fixtures.simple);
      const first = yield* programOf(pkg);
      const second = yield* programOf(pkg);

      assert.notStrictEqual(first.packageId, second.packageId);
      assert.deepStrictEqual(yield* writtenPathsOf(pkg), yield* writtenPathsOf(pkg));
    }),
  );
});

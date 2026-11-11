/**
 * The import's parse (`#pantry/import/parsed.ts`), through the public `parsePackage`
 * (`#pantry/api/import.ts`), on the host: a parsed package holds every entry once, read from the
 * file system once, with the bytes its writer wrote, and exactly the paths the import's reference
 * rows name; and the import's build and the preview, given it, read nothing of the package again
 * and build what they build from the package's directory.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, FileSystem, Ref } from "effect";
import { parsePackage, previewPackage } from "#pantry/api/import.ts";
import type { ParsedPackage } from "#pantry/import/parsed.ts";
import { readProgram, rowCountsOf } from "#pantry/import/program.ts";
import { packageNameOf } from "#pantry/import/record.ts";
import {
  everyRelationPackage,
  memberCounts,
  scopedPackage,
} from "#pantry/test/gen/every-relation.ts";
import type { PackageEntries } from "#pantry/test/gen/every-relation.ts";
import { manifestPath } from "#pantry/vocab/terms/package.ts";

/**
 * The situations the search reaches: a reference resolved of each census, and a referenced path
 * that is no document, a file a player fetches.
 */
type ParseSituation = "an attribute reference" | "a text reference" | "a referenced media file";

/**
 * A file system that fails every operation with the platform's not-found error, so a program run
 * on it that reads anything of a package fails.
 */
const readsNothing = FileSystem.makeNoop({});

/**
 * Parse the package at `dir` through `parsePackage`, counting each file the file system reads, by
 * its path relative to the package directory.
 *
 * @param dir - The package directory.
 * @returns The parse's verdict, and how many times each file was read.
 */
const parsedCounted = Effect.fn("test.parsed.counted")(function* parsedCounted(dir: string) {
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
  const verdict = yield* parsePackage(dir).pipe(
    Effect.provideService(FileSystem.FileSystem, counting),
  );

  return { reads: yield* Ref.get(reads), verdict };
});

/**
 * Read a parsed package's file bytes, each by its path.
 *
 * @param parsed - The parsed package.
 * @returns Each file's bytes by its path, in the package's order.
 */
const bytesOf = Effect.fn("test.parsed.bytes")(function* bytesOf(parsed: ParsedPackage) {
  return yield* Effect.all(
    [...parsed.files].map(([path, file]) =>
      Effect.map(
        Effect.promise(() => file.bytes()),
        (bytes) => [path, [...bytes]] as const,
      ),
    ),
  );
});

/**
 * A package's entries without its manifest, every other entry as it is.
 *
 * @param entries - The package's entries.
 * @returns The entries but `imsmanifest.xml`.
 */
const withoutManifest = (entries: PackageEntries): PackageEntries =>
  new Map([...entries].filter(([path]) => path !== manifestPath));

layer(NodeServices.layer, { excludeTestServices: true })("parsePackage", (it) => {
  it.effect(
    "holds every entry once, read once, and the paths the import's references resolve to, and the import and preview read nothing of a parsed package",
    (ctx) =>
      // Oracle: the specification as a checker, by three second sources. The package's writer
      // (`everyRelationPackage`, the entries it writes to disk) for the files, their order (sorted
      // by UTF-16 code unit, as the reader lists) and their bytes; the file system's own count of
      // reads, one per entry; and the rows the import builds (`readProgram`) for `referenced`, the
      // paths of its `ReferencePath` and `TextReferencePath` rows. A file system that fails every
      // call (`FileSystem.makeNoop`) witnesses that the build and the preview of a parsed package
      // read nothing, and the build from the directory is the metamorphic twin: the same rows,
      // relation by relation, under other ids. A package without its manifest is refused by the
      // parse under `manifest-root`, as a verdict.
      // Bound: every count of 2 or 3 choices, 1 or 2 hottexts and 1 or 2 hotspots, 8 cases.
      searched(
        ctx,
        exhaust(
          {
            box: "every count of 2 or 3 choices, 1 or 2 hottexts and 1 or 2 hotspots",
            caseHang: Duration.seconds(60),
            coverage: requiredInSpace<ParseSituation>([
              "a referenced media file",
              "a text reference",
              "an attribute reference",
            ]),
            generator: memberCounts,
            limit: 8,
            literal: JSON.stringify,
            oracle: {
              kind: "specification",
              name: "the package's written entries, the file system's reads, and the import's reference rows",
            },
            suite: "pantry/import/parsed",
          },
          (members, c) =>
            Effect.gen(function* parsedOnce() {
              const entries = everyRelationPackage(members);
              const dir = yield* scopedPackage(entries);
              const { reads, verdict } = yield* parsedCounted(dir);

              assert.strictEqual(verdict.verdict, "parsed", dir);
              if (verdict.verdict !== "parsed") {
                return;
              }

              const parsed = verdict.package;
              const paths = [...entries.keys()].toSorted();

              assert.deepStrictEqual([...parsed.files.keys()], paths);
              assert.deepStrictEqual(
                [...reads].toSorted(([x], [y]) => (x < y ? -1 : 1)),
                paths.map((path) => [path, 1] as const),
                "each file read once",
              );
              assert.deepStrictEqual(
                yield* bytesOf(parsed),
                paths.map((path) => [path, [...(entries.get(path) ?? [])]] as const),
              );
              for (const [path, file] of parsed.files) {
                assert.strictEqual(file.name, path);
                assert.strictEqual(file.type, "", path);
              }

              assert.strictEqual(parsed.name, packageNameOf(dir));
              assert.deepStrictEqual(
                parsed.documents.slice(0, 1).map(({ documentType, path }) => [documentType, path]),
                [["manifest", manifestPath]],
              );

              const documentPaths = parsed.documents.map(({ path }) => path);

              assert.strictEqual(new Set(documentPaths).size, documentPaths.length);

              const built = yield* readProgram(parsed).pipe(
                Effect.provideService(FileSystem.FileSystem, readsNothing),
              );
              const rebuilt = yield* readProgram(parsed).pipe(
                Effect.provideService(FileSystem.FileSystem, readsNothing),
              );
              const fromDirectory = yield* readProgram(dir);
              const written = [
                ...built.inputs.ReferencePath.values(),
                ...built.inputs.TextReferencePath.values(),
              ].map(({ path }) => path);

              assert.deepStrictEqual(
                [...parsed.referenced].toSorted(),
                [...new Set(written)].toSorted(),
              );
              assert.deepStrictEqual(
                Object.fromEntries(rowCountsOf(built)),
                Object.fromEntries(rowCountsOf(fromDirectory)),
              );
              assert.notStrictEqual(built.packageId, rebuilt.packageId);
              assert.notStrictEqual(built.packageId, fromDirectory.packageId);

              const [record] = built.inputs.Package.values();

              assert.deepStrictEqual(
                record?.entries.map(({ content, path }) => [path, [...content]] as const),
                yield* bytesOf(parsed),
              );

              const previewed = yield* previewPackage(parsed).pipe(
                Effect.provideService(FileSystem.FileSystem, readsNothing),
              );
              const parsedAgain = yield* parsePackage(parsed).pipe(
                Effect.provideService(FileSystem.FileSystem, readsNothing),
              );

              assert.strictEqual(previewed.verdict, "previewed");
              assert.strictEqual(
                parsedAgain.verdict === "parsed" ? parsedAgain.package : undefined,
                parsed,
              );

              const refused = yield* parsePackage(yield* scopedPackage(withoutManifest(entries)));

              assert.strictEqual(
                refused.verdict === "refused" ? refused.refusal.rule : undefined,
                "manifest-root",
              );

              if (built.inputs.ReferencePath.size > 0) {
                c.note("an attribute reference");
              }

              if (built.inputs.TextReferencePath.size > 0) {
                c.note("a text reference");
              }

              if ([...parsed.referenced].some((path) => !documentPaths.includes(path))) {
                c.note("a referenced media file");
              }
            }).pipe(Effect.scoped),
        ),
      ),
  );
});

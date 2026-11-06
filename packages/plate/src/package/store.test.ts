import { readdir } from "node:fs/promises";
import path from "node:path";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import type { Array as Arr } from "effect";
import { corpusRoot, readCorpusFile } from "#plate/document/corpus.ts";
import { readSource } from "#plate/document/read.ts";
import { readManifest } from "#plate/package/manifest.ts";
import type { Manifest, ManifestHref, ManifestResource } from "#plate/package/manifest.ts";
import {
  checkFiles,
  fileLocation,
  manifestFile,
  normalisePath,
  packageFiles,
} from "#plate/package/store.ts";
import type { Location, Refusal } from "#plate/validate/refusal.ts";
import { manifestNamespace } from "#plate/vocabulary.ts";

/**
 * The location every hand-built package in these tests carries.
 */
const location = "package.zip";

/**
 * The path step of an element in the manifest's namespace, as a resource's location spells it.
 */
const cp = `{${manifestNamespace}}`;

/**
 * The location a refusal of the whole package carries.
 */
const wholeDocument: Location = { kind: "document" };

/**
 * The corpus packages these tests read, each the directory its zip was extracted into.
 */
const corpusPackages = {
  begGuide: "QTI3_BeginnersGuide_Examples/BegGuide_March2025.zip.d",
  pci: "qtiv3-examples/packaging/pci/pci_item_examples.zip.d",
} as const;

/**
 * One refusal as these tests compare it: its rule, document, location and detail.
 */
interface Seen {
  readonly detail: Readonly<Record<string, string>>;
  readonly document: string;
  readonly location: Location;
  readonly rule: string;
}

/**
 * Take the facts of a refusal these tests compare.
 *
 * @param refusal The refusal.
 * @returns Its rule, document, location and detail.
 */
const seen = (refusal: Refusal): Seen => ({
  detail: refusal.detail,
  document: refusal.document,
  location: refusal.location,
  rule: refusal.rule,
});

/**
 * Take the facts of every refusal of a check, none when it passes.
 *
 * @param result The check's result.
 * @returns The refusals' facts, in order.
 */
const refusalsOf = <A>(result: Result.Result<A, Arr.NonEmptyReadonlyArray<Refusal>>): Seen[] =>
  Result.isFailure(result) ? result.failure.map((refusal) => seen(refusal)) : [];

/**
 * Write a manifest `file` entry, or a resource's `href`, that names a package path.
 *
 * @param href The reference as written, which is also the path it names.
 * @returns The entry.
 */
const relative = (href: string): ManifestHref => ({ href, path: Option.some(href) });

/**
 * Build one item resource of a hand-built manifest.
 *
 * @param identifier The resource's identifier.
 * @param index Its position among the manifest's resources, from 1.
 * @param files Its `file` entries.
 * @returns The resource.
 */
const resource = (
  identifier: string,
  index: number,
  files: readonly ManifestHref[],
): ManifestResource => ({
  dependencies: [],
  files,
  href: Option.fromUndefinedOr(files[0]),
  identifier,
  location: `${cp}manifest/${cp}resources/${cp}resource[${index}]`,
  type: "imsqti_item_xmlv3p0",
});

/**
 * Build a hand-built manifest of 3.0.0 resources.
 *
 * @param resources Its resources.
 * @returns The manifest.
 */
const manifestOf = (...resources: readonly ManifestResource[]): Manifest => ({
  identifier: "M",
  resources,
  version: "3.0.0",
});

/**
 * Hold a hand-built package's files, each key mapped to itself.
 *
 * @param keys The files' keys, as the package's reader found them.
 * @returns The files.
 */
const held = (...keys: readonly string[]): ReadonlyMap<string, string> =>
  new Map(keys.map((key) => [key, key]));

/**
 * The manifest of one hand-built package: an item `items/a.xml`, which its file names.
 */
const oneItem = manifestOf(resource("a", 1, [relative("items/a.xml")]));

/**
 * Take a normalised path; the test fails when it is refused.
 *
 * @param written The key as written.
 * @returns Its normal form.
 */
const normalised = (written: string): string => {
  const result = normalisePath(written, location);
  assert.deepStrictEqual(
    Result.isFailure(result) ? seen(result.failure) : undefined,
    undefined,
    `${written} is inside the package`,
  );

  return Result.getOrThrow(result);
};

/**
 * Read the files of an extracted corpus package, each keyed by its path from the package's root
 * and mapped to that path.
 *
 * @param directory The package's directory under the corpus root.
 * @returns Its files.
 */
const corpusFiles = (directory: string) =>
  Effect.gen(function* listCorpusFiles() {
    const root = path.join(yield* corpusRoot, directory);
    const entries = yield* Effect.tryPromise(() =>
      readdir(root, { recursive: true, withFileTypes: true }),
    );

    return held(
      ...entries
        .filter((entry) => entry.isFile())
        .map((entry) =>
          path.relative(root, path.join(entry.parentPath, entry.name)).split(path.sep).join("/"),
        ),
    );
  });

/**
 * Read the manifest of an extracted corpus package at the location the package's files give it;
 * the test fails when it is refused.
 *
 * @param directory The package's directory under the corpus root.
 * @returns The manifest.
 */
const corpusManifest = (directory: string) =>
  readCorpusFile(`${directory}/${manifestFile}`).pipe(
    Effect.flatMap((bytes) => readSource(fileLocation(directory, manifestFile), bytes)),
    Effect.map((source) => {
      const manifest = readManifest(source);
      assert.isTrue(Result.isSuccess(manifest), `${directory}'s manifest is read`);

      return Result.getOrThrow(manifest);
    }),
  );

describe("package/store.ts", () => {
  describe("normalisePath", () => {
    it("leaves a path in normal form as it is", () => {
      assert.strictEqual(normalised("imsmanifest.xml"), "imsmanifest.xml");
      assert.strictEqual(normalised("items/resources/crows.jpg"), "items/resources/crows.jpg");
    });

    it("removes . segments, and resolves a .. segment against the segment before it", () => {
      assert.strictEqual(normalised("./items/./a.xml"), "items/a.xml");
      assert.strictEqual(normalised("items/sub/../a.xml"), "items/a.xml");
      assert.strictEqual(normalised("items/sub/.."), "items/");
    });

    it("reads a backslash as a segment separator, so no backslash is left", () => {
      assert.strictEqual(normalised(String.raw`items\a.xml`), "items/a.xml");
      assert.strictEqual(normalised(String.raw`items\sub\..\a.xml`), "items/a.xml");
    });

    it("keeps a percent escape, a query and a fragment as characters of the file's name", () => {
      assert.strictEqual(normalised("items/a%20b.xml"), "items/a%20b.xml");
      assert.strictEqual(normalised("items/a?b#c.xml"), "items/a?b#c.xml");
    });

    it("refuses a path that climbs above the root as package-path-outside, naming it", () => {
      for (const written of ["../x", "items/../../x", String.raw`..\x`, ".."]) {
        const result = normalisePath(written, location);

        assert.deepStrictEqual(
          Result.isFailure(result) ? seen(result.failure) : undefined,
          {
            detail: { path: written },
            document: location,
            location: wholeDocument,
            rule: "package-path-outside",
          },
          written,
        );
      }
    });

    it("refuses a rooted path as package-path-outside, so no leading / is left", () => {
      for (const written of ["/x", String.raw`\x`, ".//x", "items/..//x"]) {
        const result = normalisePath(written, location);

        assert.deepStrictEqual(
          Result.isFailure(result) ? seen(result.failure).rule : undefined,
          "package-path-outside",
          written,
        );
      }
    });
  });

  describe("checkFiles", () => {
    it.effect(
      "[P-1] BegGuide_March2025 holds every file it lists and lists every file it holds",
      () =>
        Effect.gen(function* begGuide() {
          const directory = corpusPackages.begGuide;
          const manifest = yield* corpusManifest(directory);
          const files = yield* corpusFiles(directory);
          const result = checkFiles(manifest, files, directory);

          assert.deepStrictEqual(refusalsOf(result), []);
          assert.deepStrictEqual(
            [...Result.getOrThrow(result).keys()].toSorted(),
            [...files.keys()].toSorted(),
          );
          assert.lengthOf(files, 12);
        }),
      { tags: ["corpus"] },
    );

    it.effect(
      "[P-1] pci_item_examples holds a file it does not list, and lists a file it does not hold",
      () =>
        Effect.gen(function* pci() {
          const directory = corpusPackages.pci;
          const manifest = yield* corpusManifest(directory);
          const files = yield* corpusFiles(directory);
          const locationOf = (identifier: string): Location => ({
            kind: "path",
            path:
              manifest.resources.find((entry) => entry.identifier === identifier)?.location ?? "",
          });
          const missing = (identifier: string): Seen => ({
            detail: { path: "modules/lib/raphael.js", resource: identifier },
            document: fileLocation(directory, manifestFile),
            location: locationOf(identifier),
            rule: "package-file-missing",
          });

          assert.deepStrictEqual(refusalsOf(checkFiles(manifest, files, directory)), [
            {
              detail: { path: "modules/lib/handlebars.min-latest.js" },
              document: directory,
              location: wholeDocument,
              rule: "package-file-unlisted",
            },
            missing("pci_module_shading_deps"),
            missing("pci_module_shading_deps_2"),
          ]);
        }),
      { tags: ["corpus"] },
    );

    it("[P-1] refuses a hand-built map holding ../x as package-path-outside", () => {
      assert.deepStrictEqual(
        refusalsOf(checkFiles(oneItem, held(manifestFile, "items/a.xml", "../x"), location)),
        [
          {
            detail: { path: "../x" },
            document: location,
            location: wholeDocument,
            rule: "package-path-outside",
          },
        ],
      );
    });

    it("refuses a package with no imsmanifest.xml at its root as package-manifest-missing", () => {
      assert.deepStrictEqual(
        refusalsOf(checkFiles(oneItem, held("items/a.xml", "items/imsmanifest.xml"), location)),
        [
          {
            detail: {},
            document: location,
            location: wholeDocument,
            rule: "package-manifest-missing",
          },
          {
            detail: { path: "items/imsmanifest.xml" },
            document: location,
            location: wholeDocument,
            rule: "package-file-unlisted",
          },
        ],
      );
    });

    it("compares each held key in its normal form, and gives the files keyed by it", () => {
      const result = checkFiles(
        oneItem,
        held(`./${manifestFile}`, String.raw`items\sub\..\a.xml`),
        location,
      );

      assert.deepStrictEqual(refusalsOf(result), []);
      assert.deepStrictEqual(
        [...Result.getOrThrow(result)],
        [
          [manifestFile, `./${manifestFile}`],
          ["items/a.xml", String.raw`items\sub\..\a.xml`],
        ],
      );
    });

    it("passes over a directory entry, which holds no file", () => {
      const result = checkFiles(oneItem, held(manifestFile, "items/", "items/a.xml"), location);

      assert.deepStrictEqual(refusalsOf(result), []);
      assert.deepStrictEqual([...Result.getOrThrow(result).keys()], [manifestFile, "items/a.xml"]);
    });

    it("never looks for a file the manifest names by an absolute URI (reading 35)", () => {
      const manifest = manifestOf(
        resource("a", 1, [
          relative("items/a.xml"),
          { href: "https://example.org/a.css", path: Option.none() },
        ]),
      );

      assert.deepStrictEqual(
        refusalsOf(checkFiles(manifest, held(manifestFile, "items/a.xml"), location)),
        [],
      );
    });

    it("refuses a missing file once for each resource that lists it, at that resource", () => {
      const manifest = manifestOf(
        resource("a", 1, [relative("items/a.xml"), relative("shared.css"), relative("shared.css")]),
        resource("b", 2, [relative("items/b.xml"), relative("shared.css")]),
      );
      const missing = (identifier: string, index: number): Seen => ({
        detail: { path: "shared.css", resource: identifier },
        document: fileLocation(location, manifestFile),
        location: { kind: "path", path: `${cp}manifest/${cp}resources/${cp}resource[${index}]` },
        rule: "package-file-missing",
      });

      assert.deepStrictEqual(
        refusalsOf(
          checkFiles(manifest, held(manifestFile, "items/a.xml", "items/b.xml"), location),
        ),
        [missing("a", 1), missing("b", 2)],
      );
    });
  });

  describe("packageFiles", () => {
    it("keys the files by their normal form and refuses what checkFiles refuses of the keys", () => {
      const files = held(`./${manifestFile}`, "items/a.xml");

      assert.deepStrictEqual(
        [...Result.getOrThrow(packageFiles(files, location)).keys()],
        [manifestFile, "items/a.xml"],
      );
      assert.deepStrictEqual(
        refusalsOf(packageFiles(held("items/a.xml", "../x"), location)).map((entry) => entry.rule),
        ["package-path-outside", "package-manifest-missing"],
      );
    });
  });
});

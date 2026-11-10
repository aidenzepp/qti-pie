import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { openPackage } from "#plate/index.ts";
import type { PackageResource, PackageVerdict } from "#plate/index.ts";

/**
 * The package's root directory, found from the entry module it exports.
 */
const packageDirectory = fileURLToPath(new URL("../", import.meta.resolve("#plate/index.ts")));

/**
 * The package the tests open: two single-Choice items, `full`, whose resource writes LOM and every
 * `qtiMetadata` element but a portable custom interaction's context, and `bare`, whose resource
 * writes no metadata. Every variant edits its manifest's text in memory.
 */
const fixtureLocation = "fixtures/m3f/metadata";

/**
 * Read every file under a directory, keyed by its path from the directory with `/` separators, as
 * a host unzips a package.
 *
 * @param root The directory.
 * @returns The files.
 */
const filesOf = Effect.fnUntraced(function* filesOf(root: string) {
  const entries = yield* Effect.tryPromise(() =>
    readdir(root, { recursive: true, withFileTypes: true }),
  );
  const paths = entries
    .filter((entry) => entry.isFile())
    .map((entry) =>
      path.relative(root, path.join(entry.parentPath, entry.name)).split(path.sep).join("/"),
    );
  const contents = yield* Effect.all(
    paths.map((file) => Effect.tryPromise(() => readFile(path.join(root, file)))),
  );

  return new Map(paths.map((file, index) => [file, contents[index] ?? new Uint8Array()] as const));
});

/**
 * Replace the one place a variant changes, failing when the fixture's manifest no longer writes
 * the text the variant expects, so a variant never silently equals the fixture.
 *
 * @param manifest The manifest's text.
 * @param from The text to replace, written once.
 * @param to Its replacement.
 * @returns The manifest with `from` replaced by `to`.
 */
const replaced = (manifest: string, from: string, to: string): string => {
  assert.include(
    manifest,
    from,
    "the fixture's manifest no longer writes the text a variant edits",
  );

  return manifest.replace(from, () => to);
};

/**
 * Build the edit that makes a variant: each replacement applied to the manifest in order.
 *
 * @param replacements Each pair is the text the fixture writes and the text a variant writes in
 *   its place.
 * @returns The edit {@link openFixture} takes.
 */
const editedBy =
  (replacements: readonly (readonly [from: string, to: string])[]) =>
  (manifest: string): string => {
    let text = manifest;
    for (const [from, to] of replacements) {
      text = replaced(text, from, to);
    }

    return text;
  };

/**
 * Open the fixture package, its manifest edited first.
 *
 * @param edit Rewrites the manifest's text; the fixture's own by default.
 * @returns The verdict on the package.
 */
const openFixture = Effect.fnUntraced(function* openFixture(
  edit: (manifest: string) => string = (manifest) => manifest,
) {
  const files = new Map(yield* filesOf(path.join(packageDirectory, fixtureLocation)));
  const manifest = files.get("imsmanifest.xml");
  assert.isDefined(manifest, "the fixture has an imsmanifest.xml");
  files.set("imsmanifest.xml", new TextEncoder().encode(edit(new TextDecoder().decode(manifest))));

  return yield* openPackage(fixtureLocation, files);
});

/**
 * Take one resource of a package verdict by its identifier, failing when it has none.
 *
 * @param verdict The package verdict.
 * @param identifier The resource's identifier.
 * @returns The resource.
 */
const resourceOf = (verdict: PackageVerdict, identifier: string): PackageResource =>
  verdict.resources.find((resource) => resource.identifier === identifier) ??
  assert.fail(`the package has no resource ${identifier}: it is ${verdict.verdict}`);

/**
 * Take the `qtiMetadata` of the `full` resource of a package verdict, failing when it has none.
 *
 * @param verdict The package verdict.
 * @returns The resource's QTI metadata.
 */
const qtiOfVerdict = (verdict: PackageVerdict) =>
  Option.getOrElse(resourceOf(verdict, "full").metadata.qti, () =>
    assert.fail("the full resource writes qtiMetadata"),
  );

/**
 * Open the fixture and take the `qtiMetadata` of its `full` resource, failing when it has none.
 *
 * @param edit Rewrites the manifest's text; the fixture's own by default.
 * @returns The resource's QTI metadata.
 */
const qtiOf = Effect.fnUntraced(function* qtiOf(edit?: (manifest: string) => string) {
  return qtiOfVerdict(yield* openFixture(edit));
});

/**
 * Summarise the verdicts of a package: its own and each resource's document's.
 *
 * @param verdict The package verdict.
 * @returns The package's verdict, and the verdict on each resource's document, none when the
 *   resource has none.
 */
const verdictsOf = (verdict: PackageVerdict) => ({
  documents: verdict.resources.map(
    (resource) =>
      [
        resource.identifier,
        resource.verdict.pipe(Option.map((document) => document.verdict)),
      ] as const,
  ),
  package: verdict.verdict,
});

/**
 * Write a `qtiMetadata` child.
 *
 * @param local The child's local name.
 * @param text The child's text, written as given.
 * @returns The element's text.
 */
const written = (local: string, text: string): string => `<qtim:${local}>${text}</qtim:${local}>`;

/**
 * The text of each `qtiMetadata` child the fixture writes and a variant replaces, as the fixture's
 * manifest spells it.
 */
const fixtureWrites = {
  composite: written("composite", " true "),
  feedbackType: written("feedbackType", "nonadaptive"),
  firstInteractionType: written("interactionType", "choiceInteraction"),
  itemTemplate: written("itemTemplate", "false"),
  scoringMode: written("scoringMode", "responseprocessing"),
  solutionAvailable: written("solutionAvailable", "true"),
  timeDependent: written("timeDependent", "0"),
  toolName: written("toolName", "  Plate Authoring  "),
  toolVendor: written("toolVendor", "  Plate Tools  "),
  toolVersion: written("toolVersion", " 3.2.1 "),
} as const;

/**
 * Write the `scoringMode` children of a variant, in the order given.
 *
 * @param modes The text of each `scoringMode`.
 * @returns The elements' text, joined.
 */
const scoringModesWritten = (modes: readonly string[]): string =>
  modes.map((mode) => written("scoringMode", mode)).join("");

/**
 * A tool name of more than 256 characters: inner spacing, then 300 characters with no space. The
 * metadata schema's `String256DType`, the type of a tool's three strings, allows at most 256.
 */
const longToolName = `Plate   Authoring ${"n".repeat(300)}`;

/**
 * A tool version of 300 characters, more than the 256 `String256DType` allows.
 */
const longToolVersion = "9".repeat(300);

/**
 * A tool vendor of 300 characters, more than the 256 `String256DType` allows.
 */
const longToolVendor = "v".repeat(300);

/**
 * Pad a text with outer XML whitespace as a hand-written manifest might.
 *
 * @param text The text.
 * @returns The text with a newline, spaces and a tab before it and spaces after it.
 */
const padded = (text: string): string => `\n    ${text}\t  `;

/**
 * Count the characters of a string a `qtiMetadata` reads, zero when it reads none.
 *
 * @param text The string the metadata reads.
 * @returns Its length.
 */
const lengthOf = (text: Option.Option<string>): number =>
  text.pipe(
    Option.map((value) => value.length),
    Option.getOrElse(() => 0),
  );

describe("metadata reader defaults", () => {
  it.effect(
    "[P-7] [M-1] a flag outside xs:boolean reads as none and the package stays accepted",
    () =>
      Effect.gen(function* checkMalformedFlag() {
        const fixture = yield* qtiOf();
        const variant = yield* openFixture(
          editedBy([[fixtureWrites.itemTemplate, written("itemTemplate", "maybe")]]),
        );

        assert.strictEqual(variant.verdict, "accepted");
        assert.deepStrictEqual(qtiOfVerdict(variant), {
          ...fixture,
          itemTemplate: Option.none(),
        });
      }),
  );

  it.effect("[M-2] [M-3] a flag in another case or padded and malformed reads as none", () =>
    Effect.gen(function* checkOtherCaseFlags() {
      const fixture = yield* qtiOf();
      const variant = yield* qtiOf(
        editedBy([
          [fixtureWrites.timeDependent, written("timeDependent", "TRUE")],
          [fixtureWrites.composite, written("composite", " yes ")],
        ]),
      );

      assert.deepStrictEqual(variant, {
        ...fixture,
        composite: Option.none(),
        timeDependent: Option.none(),
      });
    }),
  );

  it.effect("[M-6] a padded well-formed flag is still read after trimming", () =>
    Effect.gen(function* checkPaddedFlag() {
      const fixture = yield* qtiOf();
      const variant = yield* qtiOf(
        editedBy([[fixtureWrites.solutionAvailable, written("solutionAvailable", "  false  ")]]),
      );

      assert.deepStrictEqual(fixture.solutionAvailable, Option.some(true));
      assert.deepStrictEqual(variant, { ...fixture, solutionAvailable: Option.some(false) });
    }),
  );

  it.effect("[M-5] a feedbackType outside its three values reads as none", () =>
    Effect.gen(function* checkUnknownFeedbackType() {
      const fixture = yield* qtiOf();
      const variant = yield* qtiOf(
        editedBy([[fixtureWrites.feedbackType, written("feedbackType", "sometimes")]]),
      );

      assert.deepStrictEqual(variant, { ...fixture, feedbackType: Option.none() });
    }),
  );

  it.effect(
    "[M-5] a feedbackType in another case reads as none: the enumeration is case-sensitive",
    () =>
      Effect.gen(function* checkFeedbackTypeCase() {
        const fixture = yield* qtiOf();
        const variant = yield* qtiOf(
          editedBy([[fixtureWrites.feedbackType, written("feedbackType", "Nonadaptive")]]),
        );

        assert.deepStrictEqual(variant, { ...fixture, feedbackType: Option.none() });
      }),
  );

  it.effect(
    "[M-10] a scoringMode outside its three values is dropped and the others kept in order",
    () =>
      Effect.gen(function* checkUnknownScoringMode() {
        const fixture = yield* qtiOf();
        const variant = yield* qtiOf(
          editedBy([
            [
              fixtureWrites.scoringMode,
              scoringModesWritten(["responseprocessing", "robot", "human"]),
            ],
          ]),
        );

        assert.deepStrictEqual(variant.scoringModes, ["responseprocessing", "human"]);
        assert.deepStrictEqual(variant, {
          ...fixture,
          scoringModes: ["responseprocessing", "human"],
        });
      }),
  );

  it.effect("[M-10] a scoringMode in another case is dropped", () =>
    Effect.gen(function* checkScoringModeCase() {
      const fixture = yield* qtiOf();
      const variant = yield* qtiOf(
        editedBy([[fixtureWrites.scoringMode, scoringModesWritten(["Human"])]]),
      );

      assert.deepStrictEqual(variant.scoringModes, []);
      assert.deepStrictEqual(variant, { ...fixture, scoringModes: [] });
    }),
  );

  it.effect("[M-4] an interactionType outside the enumeration is kept as written", () =>
    Effect.gen(function* checkUnknownInteractionType() {
      const fixture = yield* qtiOf();
      const variant = yield* qtiOf(
        editedBy([
          [fixtureWrites.firstInteractionType, written("interactionType", "zorkInteraction")],
        ]),
      );

      assert.deepStrictEqual(variant.interactionTypes, ["zorkInteraction", "textEntryInteraction"]);
      assert.deepStrictEqual(variant, {
        ...fixture,
        interactionTypes: ["zorkInteraction", "textEntryInteraction"],
      });
    }),
  );

  it.effect(
    "[M-7] [M-8] [M-9] a tool string longer than 256 characters is kept whole, with its inner spacing",
    () =>
      Effect.gen(function* checkLongToolStrings() {
        const fixture = yield* qtiOf();
        const variant = yield* qtiOf(
          editedBy([
            [fixtureWrites.toolName, written("toolName", padded(longToolName))],
            [fixtureWrites.toolVersion, written("toolVersion", padded(longToolVersion))],
            [fixtureWrites.toolVendor, written("toolVendor", padded(longToolVendor))],
          ]),
        );

        assert.isAbove(longToolName.length, 256);
        assert.isAbove(lengthOf(variant.toolName), 256);
        assert.isAbove(lengthOf(variant.toolVersion), 256);
        assert.isAbove(lengthOf(variant.toolVendor), 256);
        assert.deepStrictEqual(variant.toolName, Option.some(longToolName));
        assert.deepStrictEqual(variant.toolVersion, Option.some(longToolVersion));
        assert.deepStrictEqual(variant.toolVendor, Option.some(longToolVendor));
        assert.deepStrictEqual(variant, {
          ...fixture,
          toolName: Option.some(longToolName),
          toolVendor: Option.some(longToolVendor),
          toolVersion: Option.some(longToolVersion),
        });
      }),
  );

  it.effect("[M-7] an empty toolName is some empty string, and an empty flag is none", () =>
    Effect.gen(function* checkEmptyElements() {
      const fixture = yield* qtiOf();
      const variant = yield* openFixture(
        editedBy([
          [fixtureWrites.toolName, "<qtim:toolName></qtim:toolName>"],
          [fixtureWrites.itemTemplate, "<qtim:itemTemplate/>"],
        ]),
      );

      assert.strictEqual(variant.verdict, "accepted");
      assert.deepStrictEqual(qtiOfVerdict(variant).toolName, Option.some(""));
      assert.deepStrictEqual(qtiOfVerdict(variant).itemTemplate, Option.none());
      assert.deepStrictEqual(qtiOfVerdict(variant), {
        ...fixture,
        itemTemplate: Option.none(),
        toolName: Option.some(""),
      });
    }),
  );

  it.effect(
    "[P-7] every malformed value together leaves the package and document verdicts unchanged",
    () =>
      Effect.gen(function* checkAllTogether() {
        const untouched = yield* openFixture();
        const variant = yield* openFixture(
          editedBy([
            [fixtureWrites.itemTemplate, written("itemTemplate", "maybe")],
            [fixtureWrites.timeDependent, written("timeDependent", "TRUE")],
            [fixtureWrites.composite, written("composite", " yes ")],
            [fixtureWrites.solutionAvailable, "<qtim:solutionAvailable/>"],
            [fixtureWrites.feedbackType, written("feedbackType", "sometimes")],
            [fixtureWrites.firstInteractionType, written("interactionType", "zorkInteraction")],
            [fixtureWrites.scoringMode, scoringModesWritten(["robot", "Human", "human"])],
            [fixtureWrites.toolName, written("toolName", padded(longToolName))],
            [fixtureWrites.toolVersion, written("toolVersion", padded(longToolVersion))],
            [fixtureWrites.toolVendor, written("toolVendor", padded(longToolVendor))],
          ]),
        );

        assert.strictEqual(untouched.verdict, "accepted");
        assert.deepStrictEqual(verdictsOf(variant), verdictsOf(untouched));
        assert.deepStrictEqual(qtiOfVerdict(variant), {
          ...qtiOfVerdict(untouched),
          composite: Option.none(),
          feedbackType: Option.none(),
          interactionTypes: ["zorkInteraction", "textEntryInteraction"],
          itemTemplate: Option.none(),
          scoringModes: ["human"],
          solutionAvailable: Option.none(),
          timeDependent: Option.none(),
          toolName: Option.some(longToolName),
          toolVendor: Option.some(longToolVendor),
          toolVersion: Option.some(longToolVersion),
        });
      }),
  );
});

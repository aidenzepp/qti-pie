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
 * writes no metadata.
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
 * Open the fixture and take the metadata of one of its resources.
 *
 * @param identifier The resource's identifier.
 * @param edit Rewrites the manifest's text; the fixture's own by default.
 * @returns The resource's metadata.
 */
const metadataOf = Effect.fnUntraced(function* metadataOf(
  identifier: string,
  edit?: (manifest: string) => string,
) {
  return resourceOf(yield* openFixture(edit), identifier).metadata;
});

/**
 * Open the fixture and take the `qtiMetadata` of its `full` resource, failing when it has none.
 *
 * @param edit Rewrites the manifest's text; the fixture's own by default.
 * @returns The resource's QTI metadata.
 */
const qtiOf = Effect.fnUntraced(function* qtiOf(edit?: (manifest: string) => string) {
  const { qti } = yield* metadataOf("full", edit);

  return Option.getOrElse(qti, () => assert.fail("the full resource writes qtiMetadata"));
});

/**
 * The fixture's `qtiMetadata` element, whole.
 *
 * @param manifest The manifest's text.
 * @returns The element's text and the manifest without it.
 */
const takeQtiMetadata = (manifest: string) => {
  const close = "</qtim:qtiMetadata>";
  const start = manifest.indexOf("<qtim:qtiMetadata>");
  const end = manifest.indexOf(close) + close.length;
  assert.isAtLeast(start, 0, "the fixture's manifest writes a qtiMetadata");

  return {
    block: manifest.slice(start, end),
    rest: manifest.slice(0, start) + manifest.slice(end),
  };
};

/**
 * Move the fixture's `qtiMetadata` from beside its `lom` to inside it.
 *
 * @param manifest The manifest's text.
 * @returns The manifest with the element the `lom`'s last child.
 */
const qtiInsideLom = (manifest: string): string => {
  const { block, rest } = takeQtiMetadata(manifest);

  return replaced(rest, "</lom:lom>", `${block}</lom:lom>`);
};

/**
 * What a `qtiMetadata` that writes no element reads as: every value absent.
 */
const unwritten = {
  composite: Option.none(),
  feedbackType: Option.none(),
  interactionTypes: [],
  itemTemplate: Option.none(),
  portableCustomInteractionContext: Option.none(),
  scoringModes: [],
  solutionAvailable: Option.none(),
  timeDependent: Option.none(),
  toolName: Option.none(),
  toolVendor: Option.none(),
  toolVersion: Option.none(),
};

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
 * Open the fixture with a portable custom interaction context written before its `feedbackType`,
 * and take the `qtiMetadata` of its `full` resource.
 *
 * @param context What the `portableCustomInteractionContext` holds.
 * @returns The resource's QTI metadata.
 */
const qtiWithContext = (context: string) =>
  qtiOf((manifest) =>
    replaced(
      manifest,
      "<qtim:feedbackType>nonadaptive</qtim:feedbackType>",
      `<qtim:portableCustomInteractionContext>${context}</qtim:portableCustomInteractionContext><qtim:feedbackType>nonadaptive</qtim:feedbackType>`,
    ),
  );

/**
 * Open the fixture with its one `scoringMode` replaced by the given ones, and take the
 * `qtiMetadata` of its `full` resource.
 *
 * @param modes The text of each `scoringMode`, in the order written.
 * @returns The resource's QTI metadata.
 */
const qtiWithScoringModes = (modes: readonly string[]) =>
  qtiOf((manifest) =>
    replaced(
      manifest,
      "<qtim:scoringMode>responseprocessing</qtim:scoringMode>",
      modes.map((mode) => `<qtim:scoringMode>${mode}</qtim:scoringMode>`).join(""),
    ),
  );

/**
 * A LOM record whose `general` gives only a title, written under a place the resource's metadata
 * must not read.
 */
const strayLom = `<lom:lom><lom:general><lom:title><lom:string language="en">Stray title</lom:string></lom:title></lom:general></lom:lom>`;

/**
 * A `qtiMetadata` written under a place the resource's metadata must not read.
 */
const strayQti = `<qtim:qtiMetadata><qtim:composite>false</qtim:composite><qtim:toolName>Stray tool</qtim:toolName></qtim:qtiMetadata>`;

describe("resource metadata", () => {
  it.effect(
    "[P-6] a resource's LOM general reaches its metadata as the manifest reader reads it",
    () =>
      Effect.gen(function* checkLom() {
        const { lom } = yield* metadataOf("full");

        assert.strictEqual(lom.length, 1);

        const [general] = lom;
        assert.isDefined(general);
        assert.deepStrictEqual(
          general.identifier.pipe(Option.map((identifier) => [...identifier.values])),
          Option.some(["full"]),
        );
        assert.deepStrictEqual(
          general.title.pipe(Option.map((title) => [...title.values])),
          Option.some(["Fully described item"]),
        );
        assert.deepStrictEqual(general.languages, ["en"]);
      }),
  );

  it.effect("[P-7] a resource that writes no metadata has none: lom empty and qti none", () =>
    Effect.gen(function* checkBare() {
      assert.deepStrictEqual(yield* metadataOf("bare"), { lom: [], qti: Option.none() });
    }),
  );

  it.effect("[P-7] an empty qtiMetadata is some with every value absent, not none", () =>
    Effect.gen(function* checkEmpty() {
      const metadata = yield* metadataOf("full", (manifest) =>
        replaced(manifest, takeQtiMetadata(manifest).block, "<qtim:qtiMetadata/>"),
      );

      assert.deepStrictEqual(metadata.qti, Option.some(unwritten));
    }),
  );

  it.effect(
    "[P-7] [M-1] [M-2] [M-3] the three boolean flags are read, each true or false as written",
    () =>
      Effect.gen(function* checkFlags() {
        const qti = yield* qtiOf();

        assert.deepStrictEqual(qti.itemTemplate, Option.some(false));
        assert.deepStrictEqual(qti.timeDependent, Option.some(false));
        assert.deepStrictEqual(qti.composite, Option.some(true));

        const flipped = yield* qtiOf((manifest) =>
          replaced(
            replaced(
              replaced(
                manifest,
                "<qtim:itemTemplate>false</qtim:itemTemplate>",
                "<qtim:itemTemplate>\t1\n</qtim:itemTemplate>",
              ),
              "<qtim:timeDependent>0</qtim:timeDependent>",
              "<qtim:timeDependent> true </qtim:timeDependent>",
            ),
            "<qtim:composite> true </qtim:composite>",
            "<qtim:composite>0</qtim:composite>",
          ),
        );

        assert.deepStrictEqual(flipped.itemTemplate, Option.some(true));
        assert.deepStrictEqual(flipped.timeDependent, Option.some(true));
        assert.deepStrictEqual(flipped.composite, Option.some(false));
      }),
  );

  it.effect("[P-7] [M-1] [M-2] [M-3] a flag the entry does not write is none", () =>
    Effect.gen(function* checkAbsentFlags() {
      const qti = yield* qtiOf((manifest) =>
        replaced(
          replaced(
            replaced(manifest, "<qtim:itemTemplate>false</qtim:itemTemplate>", ""),
            "<qtim:timeDependent>0</qtim:timeDependent>",
            "",
          ),
          "<qtim:composite> true </qtim:composite>",
          "",
        ),
      );

      assert.deepStrictEqual(qti.itemTemplate, Option.none());
      assert.deepStrictEqual(qti.timeDependent, Option.none());
      assert.deepStrictEqual(qti.composite, Option.none());
    }),
  );

  it.effect("[M-4] every interactionType is kept in document order", () =>
    Effect.gen(function* checkInteractionTypes() {
      const qti = yield* qtiOf();

      assert.deepStrictEqual(qti.interactionTypes, ["choiceInteraction", "textEntryInteraction"]);

      const reordered = yield* qtiOf((manifest) =>
        replaced(
          manifest,
          "<qtim:interactionType>choiceInteraction</qtim:interactionType>\n          <qtim:interactionType>textEntryInteraction</qtim:interactionType>",
          "<qtim:interactionType>textEntryInteraction</qtim:interactionType><qtim:interactionType>choiceInteraction</qtim:interactionType><qtim:interactionType>textEntryInteraction</qtim:interactionType>",
        ),
      );

      assert.deepStrictEqual(reordered.interactionTypes, [
        "textEntryInteraction",
        "choiceInteraction",
        "textEntryInteraction",
      ]);
    }),
  );

  it.effect("[M-4] a resource with no interactionType has an empty list", () =>
    Effect.gen(function* checkNoInteractionTypes() {
      const qti = yield* qtiOf((manifest) =>
        replaced(
          manifest,
          "<qtim:interactionType>choiceInteraction</qtim:interactionType>\n          <qtim:interactionType>textEntryInteraction</qtim:interactionType>\n",
          "",
        ),
      );

      assert.deepStrictEqual(qti.interactionTypes, []);
    }),
  );

  it.effect(
    "[M-4] a portableCustomInteractionContext gives its two strings, and an absent one is none",
    () =>
      Effect.gen(function* checkPciContext() {
        assert.deepStrictEqual((yield* qtiOf()).portableCustomInteractionContext, Option.none());

        const withContext = yield* qtiOf((manifest) =>
          replaced(
            manifest,
            "<qtim:interactionType>textEntryInteraction</qtim:interactionType>",
            "<qtim:interactionType>portableCustomInteraction</qtim:interactionType><qtim:portableCustomInteractionContext><qtim:customTypeIdentifier>urn:example:slider-pci</qtim:customTypeIdentifier><qtim:interactionKind>slider</qtim:interactionKind></qtim:portableCustomInteractionContext>",
          ),
        );

        assert.deepStrictEqual(withContext.interactionTypes, [
          "choiceInteraction",
          "portableCustomInteraction",
        ]);
        assert.deepStrictEqual(
          withContext.portableCustomInteractionContext,
          Option.some({
            customTypeIdentifier: Option.some("urn:example:slider-pci"),
            interactionKind: Option.some("slider"),
          }),
        );
      }),
  );

  it.effect("[M-4] a portableCustomInteractionContext writes either string or neither", () =>
    Effect.gen(function* checkPartialPciContext() {
      assert.deepStrictEqual(
        (yield* qtiWithContext("")).portableCustomInteractionContext,
        Option.some({ customTypeIdentifier: Option.none(), interactionKind: Option.none() }),
      );
      assert.deepStrictEqual(
        (yield* qtiWithContext("<qtim:interactionKind>drawing</qtim:interactionKind>"))
          .portableCustomInteractionContext,
        Option.some({
          customTypeIdentifier: Option.none(),
          interactionKind: Option.some("drawing"),
        }),
      );
      assert.deepStrictEqual(
        (yield* qtiWithContext(
          "<qtim:customTypeIdentifier>urn:example:pci</qtim:customTypeIdentifier>",
        )).portableCustomInteractionContext,
        Option.some({
          customTypeIdentifier: Option.some("urn:example:pci"),
          interactionKind: Option.none(),
        }),
      );
    }),
  );

  it.effect("[M-5] feedbackType is read as one of its three values", () =>
    Effect.gen(function* checkFeedbackType() {
      assert.deepStrictEqual((yield* qtiOf()).feedbackType, Option.some("nonadaptive"));

      for (const value of ["adaptive", "none"] as const) {
        const qti = yield* qtiOf((manifest) =>
          replaced(
            manifest,
            "<qtim:feedbackType>nonadaptive</qtim:feedbackType>",
            `<qtim:feedbackType>${value}</qtim:feedbackType>`,
          ),
        );

        assert.deepStrictEqual(qti.feedbackType, Option.some(value));
      }

      const absent = yield* qtiOf((manifest) =>
        replaced(manifest, "<qtim:feedbackType>nonadaptive</qtim:feedbackType>", ""),
      );

      assert.deepStrictEqual(absent.feedbackType, Option.none());
    }),
  );

  it.effect("[M-6] solutionAvailable is read", () =>
    Effect.gen(function* checkSolutionAvailable() {
      assert.deepStrictEqual((yield* qtiOf()).solutionAvailable, Option.some(true));

      const unavailable = yield* qtiOf((manifest) =>
        replaced(
          manifest,
          "<qtim:solutionAvailable>true</qtim:solutionAvailable>",
          "<qtim:solutionAvailable>false</qtim:solutionAvailable>",
        ),
      );

      assert.deepStrictEqual(unavailable.solutionAvailable, Option.some(false));
    }),
  );

  it.effect(
    "[M-7] [M-8] [M-9] the tool's name, version and vendor are read as trimmed strings",
    () =>
      Effect.gen(function* checkTool() {
        const qti = yield* qtiOf();

        assert.deepStrictEqual(qti.toolName, Option.some("Plate Authoring"));
        assert.deepStrictEqual(qti.toolVersion, Option.some("3.2.1"));
        assert.deepStrictEqual(qti.toolVendor, Option.some("Plate Tools"));

        const unnamed = yield* qtiOf((manifest) =>
          replaced(
            replaced(
              replaced(manifest, "<qtim:toolName>  Plate Authoring  </qtim:toolName>", ""),
              "<qtim:toolVersion> 3.2.1 </qtim:toolVersion>",
              "",
            ),
            "<qtim:toolVendor>  Plate Tools  </qtim:toolVendor>",
            "",
          ),
        );

        assert.deepStrictEqual(unnamed.toolName, Option.none());
        assert.deepStrictEqual(unnamed.toolVersion, Option.none());
        assert.deepStrictEqual(unnamed.toolVendor, Option.none());
      }),
  );

  it.effect("[M-10] scoringMode repeats and keeps document order", () =>
    Effect.gen(function* checkScoringModes() {
      assert.deepStrictEqual((yield* qtiOf()).scoringModes, ["responseprocessing"]);

      assert.deepStrictEqual(
        (yield* qtiWithScoringModes(["human", "responseprocessing"])).scoringModes,
        ["human", "responseprocessing"],
      );
      assert.deepStrictEqual(
        (yield* qtiWithScoringModes(["responseprocessing", "externalmachine", "human"]))
          .scoringModes,
        ["responseprocessing", "externalmachine", "human"],
      );
      assert.deepStrictEqual((yield* qtiWithScoringModes([])).scoringModes, []);
    }),
  );

  it.effect("[P-7] qtiMetadata inside lom reads as it does beside lom", () =>
    Effect.gen(function* checkInsideLom() {
      const beside = yield* qtiOf();
      const inside = yield* qtiOf(qtiInsideLom);

      assert.deepStrictEqual(inside, beside);
      assert.deepStrictEqual(inside.interactionTypes, [
        "choiceInteraction",
        "textEntryInteraction",
      ]);
    }),
  );

  it.effect(
    "[P-7] an entry that writes several qtiMetadata gives the first in document order",
    () =>
      Effect.gen(function* checkFirst() {
        const inner = `<qtim:qtiMetadata><qtim:toolName>Inner tool</qtim:toolName></qtim:qtiMetadata>`;
        const qti = yield* qtiOf((manifest) =>
          replaced(manifest, "</lom:lom>", `${inner}</lom:lom>`),
        );

        assert.deepStrictEqual(qti, {
          ...unwritten,
          toolName: Option.some("Inner tool"),
        });
      }),
  );

  it.effect(
    "[P-7] the package's verdict and every document verdict are unchanged by the metadata",
    () =>
      Effect.gen(function* checkVerdicts() {
        const described = yield* openFixture();
        const stripped = yield* openFixture((manifest) => {
          const resource = manifest.indexOf('<resource identifier="full"');
          const start = manifest.indexOf("<metadata>", resource);
          const end = manifest.indexOf("</metadata>", start) + "</metadata>".length;
          assert.isAtLeast(resource, 0);
          assert.isAbove(start, resource);

          return manifest.slice(0, start) + manifest.slice(end);
        });

        assert.strictEqual(described.verdict, "accepted");
        assert.deepStrictEqual(verdictsOf(described), {
          documents: [
            ["full", Option.some("accepted" as const)],
            ["bare", Option.some("accepted" as const)],
          ],
          package: "accepted",
        });
        assert.deepStrictEqual(verdictsOf(stripped), verdictsOf(described));
      }),
  );

  it.effect(
    "[P-6] a file's own metadata and the manifest's metadata are not read into a resource",
    () =>
      Effect.gen(function* checkScope() {
        const original = yield* metadataOf("full");
        const originalBare = yield* metadataOf("bare");

        const variant = yield* openFixture((manifest) =>
          replaced(
            replaced(
              manifest,
              "<schemaversion>3.0.1</schemaversion>",
              `<schemaversion>3.0.1</schemaversion>${strayLom}${strayQti}`,
            ),
            '<file href="items/full.xml"/>',
            `<file href="items/full.xml"><metadata>${strayLom}${strayQti}</metadata></file>`,
          ),
        );

        const { lom, qti } = resourceOf(variant, "full").metadata;

        assert.strictEqual(variant.verdict, "accepted");
        assert.deepStrictEqual(
          lom.map((general) => general.title.pipe(Option.map((title) => [...title.values]))),
          [Option.some(["Fully described item"])],
        );
        assert.deepStrictEqual(
          qti.pipe(Option.map((read) => read.toolName)),
          Option.some(Option.some("Plate Authoring")),
        );
        assert.deepStrictEqual(resourceOf(variant, "full").metadata, original);
        assert.deepStrictEqual(resourceOf(variant, "bare").metadata, originalBare);
        assert.deepStrictEqual(originalBare, { lom: [], qti: Option.none() });
      }),
  );
});

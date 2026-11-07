import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { ConfigProvider, Effect, FileSystem } from "effect";
import { readXml } from "@qti-pie/crust/read.ts";
import { inject } from "vitest";
import {
  FIXTURES_VERSION,
  assemblyNames,
  catalogNames,
  catalogNegativeNames,
  catalogVerdicts,
  companionNames,
  editBytes,
  fixtureNames,
  hash12,
  materialize,
  materializeCorpus,
  materializePackage,
  materializeSpec,
  negativeNames,
  pciNames,
  pciNegativeNames,
  pciVerdicts,
  restoredNames,
  specOf,
  transformHash,
} from "#pantry/test/fixtures.ts";
import type { Edit, FixtureName, FixtureSpec } from "#pantry/test/fixtures.ts";
import { settings as hostSettings } from "#pantry/test/settings.ts";

/**
 * The timeout, in milliseconds, that this file's slower tests state, each itself or through its
 * describe: a hang guard, never a budget. Measured 2026-11-07: 53.8 s at a load average of 63 to
 * 73, its slowest test. Measured 2026-11-07: 13.8 s at a load average of 8.06 to 48.90, its slowest
 * test with Stage N's fixtures, each of which states this timeout.
 */
const testTimeoutMs = 180_000;

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

/**
 * The resources of a manifest, read with plain patterns: each resource's identifier, type and
 * `href`, and the `href` of every `file` it lists.
 *
 * @param manifest - A manifest's text.
 * @returns One entry per resource, in document order.
 */
const resourcesOf = (manifest: string) =>
  [...manifest.matchAll(/<resource\b(?<attrs>[^>]*)>(?<body>[\s\S]*?)<\/resource>/gu)].map(
    (match) => {
      const attribute = (name: string) =>
        new RegExp(`\\s${name}="(?<value>[^"]*)"`, "u").exec(match.groups?.["attrs"] ?? "")
          ?.groups?.["value"] ?? "";

      return {
        files: [...(match.groups?.["body"] ?? "").matchAll(/<file href="(?<href>[^"]*)"/gu)].map(
          (file) => file.groups?.["href"] ?? "",
        ),
        href: attribute("href"),
        identifier: attribute("identifier"),
        type: attribute("type"),
      };
    },
  );

/**
 * The `href` of each item ref of a test document, as written.
 *
 * @param test - A test document's text.
 * @returns The hrefs, in document order.
 */
const itemHrefsOf = (test: string): string[] =>
  [...test.matchAll(/<qti-assessment-item-ref\b[^>]*\shref="(?<href>[^"]*)"/gu)].map(
    (match) => match.groups?.["href"] ?? "",
  );

/**
 * Every path a materialized package holds, files only.
 *
 * @param dir - The package directory.
 * @returns The file paths, relative to `dir`.
 */
const filesOf = Effect.fn("filesOf")(function* filesOf(dir: string) {
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
 * Phase 5's eleven positive fixtures with the `schemaversion` each package's manifest declares.
 */
const positiveVersions: readonly (readonly [FixtureName, "3.0.0" | "3.0.1"])[] = [
  ["stimulus-301", "3.0.1"],
  ["stimulus-shared", "3.0.0"],
  ["test-adaptive", "3.0.0"],
  ["test-content", "3.0.0"],
  ["test-include", "3.0.0"],
  ["test-linear", "3.0.0"],
  ["test-lti", "3.0.1"],
  ["test-mapping", "3.0.0"],
  ["test-section-ref", "3.0.0"],
  ["test-selection", "3.0.0"],
  ["test-template-default", "3.0.0"],
];

/**
 * The namespace of every QTI document of either version.
 */
const qtiNamespace = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

/**
 * The 60 negative fixtures of phase 5, as a literal: the spec's 4.15 last column, less the corpus
 * packages, `stimulus-300-data` (phase 8's), `section-empty` (spec reading 26: a section may hold
 * no part), and `item-duration-in-item` and `item-duration-not-timed` (spec reading 150: an item's
 * `duration` may be read whether or not the item is time dependent), plus `prefixed-ambiguous`
 * (decision 189).
 */
const expectedNegativeNames = [
  "branch-backward",
  "branch-exit-misspelled",
  "branch-into-ref",
  "branch-part-to-item",
  "branch-replacement-target",
  "branch-unknown-target",
  "duration-of-item-ref",
  "feedback-outcome-float",
  "feedback-template",
  "include-text",
  "include-xpointer",
  "instance-spelling-canonical",
  "item-in-section",
  "item-prefixed",
  "item-ref-missing",
  "item-ref-to-stimulus",
  "mapping-target-twice",
  "mapping-undeclared",
  "navigation-misspelled",
  "part-no-section",
  "part-order",
  "precondition-number-correct",
  "prefixed-ambiguous",
  "prefixed-undeclared-variable",
  "prefixed-unknown-ref",
  "rubric-empty-view",
  "rubric-in-rubric",
  "rubric-interaction",
  "rubric-no-body",
  "rubric-printed-undeclared",
  "section-adaptive-and-selection",
  "section-feedback-undeclared",
  "section-identifier-unknown",
  "section-prefixed-unresolved",
  "section-printed-undeclared",
  "section-ref-cycle",
  "section-ref-identifier-clash",
  "section-ref-to-item",
  "section-two-isc",
  "section-unprefixed-undeclared",
  "section-variable-in-test",
  "select-not-integer",
  "select-over",
  "select-under-required",
  "stimulus-300-attributes",
  "stimulus-300-include",
  "stimulus-body-empty",
  "stimulus-missing-image",
  "stimulus-ref-duplicate",
  "stimulus-ref-to-item",
  "stimulus-typed-test",
  "template-default-type",
  "template-default-undeclared",
  "test-declares-duration",
  "test-duplicate-identifier",
  "test-identifier-mismatch",
  "test-lang-no-lom",
  "test-no-part",
  "test-title-mismatch",
  "test-undeclared-variable",
] as const;

/**
 * For each non-direct negative that adds text, a file of its package and the text its breach put
 * there.
 */
const negativeBreaches: readonly (readonly [FixtureName, string, string])[] = [
  ["branch-backward", "rtest13.xml", 'target="item034"'],
  ["branch-exit-misspelled", "rtest13.xml", 'target="EXIT_TESTS"'],
  ["branch-into-ref", "rtest01.xml", 'target="shared"'],
  ["branch-part-to-item", "rtest13.xml", 'target="item653"'],
  ["branch-replacement-target", "rtest12.xml", 'target="item063"'],
  ["branch-unknown-target", "rtest13.xml", 'target="NOPE"'],
  ["feedback-outcome-float", "assessment.xml", 'identifier="PROGRESS"'],
  ["feedback-template", "assessment.xml", "<qti-template-inline"],
  ["include-text", "rtest01.xml", 'parse="text"'],
  ["include-xpointer", "rtest01.xml", 'xpointer="element(/1)"'],
  ["item-in-section", "rtest13.xml", '<qti-assessment-item identifier="inline"'],
  ["item-ref-missing", "rtest13.xml", 'href="missing.xml"'],
  ["item-ref-to-stimulus", "stimulus-test.xml", 'href="passages/unbelievableNight.xml"'],
  ["mapping-target-twice", "rtest26.xml", 'source-identifier="NOTB" target-identifier="SCORE"'],
  ["mapping-undeclared", "rtest26.xml", 'source-identifier="NOPE"'],
  ["navigation-misspelled", "rtest13.xml", 'navigation-mode="Linear"'],
  ["part-no-section", "rtest13.xml", 'identifier="RTEST-13-B" navigation-mode="linear"'],
  ["precondition-number-correct", "rtest13.xml", "<qti-number-correct/>"],
  ["prefixed-ambiguous", "rtest26.xml", 'source-identifier="K.SCORE"'],
  ["prefixed-undeclared-variable", "rtest26.xml", '<qti-variable identifier="I.NOPE"/>'],
  ["prefixed-unknown-ref", "rtest26.xml", '<qti-variable identifier="NOPE.SCORE"/>'],
  ["rubric-empty-view", "assessment.xml", 'view=""'],
  ["rubric-in-rubric", "assessment.xml", "<p>Nested</p>"],
  ["rubric-interaction", "assessment.xml", "<qti-text-entry-interaction"],
  ["rubric-printed-undeclared", "assessment.xml", '<qti-printed-variable identifier="NOPE"/>'],
  ["section-adaptive-and-selection", "adaptive-test.xml", '<qti-selection select="1"/>'],
  ["section-identifier-unknown", "rtest26.xml", 'section-identifier="NOPE"'],
  ["section-prefixed-unresolved", "test-b.xml", 'identifier="RENAMED"'],
  ["section-ref-cycle", "sections/shared.xml", 'href="shared.xml"'],
  [
    "section-ref-identifier-clash",
    "sections/shared.xml",
    '<qti-assessment-item-ref identifier="ITEMREF"',
  ],
  ["section-ref-to-item", "rtest01.xml", 'href="items/i2.xml"'],
  ["section-two-isc", "rtest13.xml", 'max-attempts="3"'],
  ["select-not-integer", "rtest12.xml", 'select="2.5"'],
  ["select-over", "rtest12.xml", 'select="9"'],
  [
    "select-under-required",
    "rtest12.xml",
    'identifier="item434" href="item434.xml" required="true"',
  ],
  ["stimulus-300-attributes", "passages/unbelievableNight.xml", '<qti-stimulus-body class="x">'],
  ["stimulus-300-include", "passages/unbelievableNight.xml", "<xi:include"],
  [
    "stimulus-body-empty",
    "passages/unbelievableNight.xml",
    "<qti-stimulus-body> </qti-stimulus-body>",
  ],
  ["stimulus-ref-to-item", "exemplar06.xml", 'href="exemplar04.xml"'],
  ["stimulus-typed-test", "imsmanifest.xml", 'identifier="Stimulus1" type="imsqti_test_xmlv3p0"'],
  ["template-default-type", "template-default-test.xml", 'base-type="string">fast'],
  ["template-default-undeclared", "template-default-test.xml", 'template-identifier="NOPE"'],
  ["test-declares-duration", "rtest13.xml", 'identifier="duration"'],
  ["test-duplicate-identifier", "rtest13.xml", 'identifier="sectionA" href="item160.xml"'],
  ["test-identifier-mismatch", "imsmanifest.xml", "<imsmd:entry>OTHER-TEST</imsmd:entry>"],
  ["test-title-mismatch", "imsmanifest.xml", "Another Test</imsmd:string>"],
  ["test-undeclared-variable", "rtest13.xml", '<qti-variable identifier="NOPE"/>'],
];

/**
 * For each negative that removes text, a file of its package and the text its breach took out.
 */
const negativeRemovals: readonly (readonly [FixtureName, string, string])[] = [
  ["rubric-no-body", "assessment.xml", "<p>Test instructions</p>"],
  ["section-feedback-undeclared", "test-b.xml", 'identifier="FLAG"'],
  ["section-printed-undeclared", "test-b.xml", 'identifier="COUNT"'],
  ["section-unprefixed-undeclared", "test-b.xml", 'identifier="SCORE"'],
  [
    "test-lang-no-lom",
    "imsmanifest.xml",
    "<imsmd:general>\n                        <imsmd:language>",
  ],
];

/**
 * For each name of `restoredNames` and `assemblyNames`, a file of its package and the text its edit
 * put there.
 */
const restoredAndAssemblyPresent: readonly (readonly [FixtureName, string, string])[] = [
  ["aria-h1-role-button", "choice.xml", '<h1 role="button">'],
  [
    "aria-source-role",
    "choice.xml",
    '<source srcset="images/sign.png" type="image/png" role="presentation"/>',
  ],
  ["lang-case-mismatch", "choice.xml", 'xml:lang="en-GB"'],
  ["lang-case-mismatch", "imsmanifest.xml", "<imsmd:language>en-gb</imsmd:language>"],
  ["pattern-unresolved-item", "choice.xml", '<qti-pattern-match pattern="{NOSUCH}">'],
  ["pattern-unresolved-test", "rtest13.xml", '<qti-pattern-match pattern="{NOSUCH}">'],
  ["pattern-unresolved-test", "rtest13.xml", "<qti-outcome-processing>"],
  [
    "section-doc-twice",
    "rtest01.xml",
    '<qti-assessment-section-ref identifier="S2" href="sections/shared.xml"/>',
  ],
  [
    "section-doc-name-clash",
    "sections/shared.xml",
    '<qti-assessment-item-ref identifier="shared" ',
  ],
  ["branch-backward-shuffled", "rtest13.xml", '<qti-ordering shuffle="true"/>'],
  ["branch-backward-shuffled", "rtest13.xml", '<qti-branch-rule target="item347">'],
  ["branch-to-own-section", "rtest13.xml", '<qti-branch-rule target="sectionB">'],
  ["select-two-required", "rtest12.xml", 'identifier="item434" href="item434.xml" required="true"'],
  [
    "branch-in-twice-placed-section",
    "rtest01.xml",
    '<qti-assessment-section-ref identifier="S2" href="sections/shared.xml"/>',
  ],
  [
    "branch-in-twice-placed-section",
    "sections/shared.xml",
    '<qti-branch-rule target="shared-item">',
  ],
];

/**
 * The `schemaversion` each catalog positive's manifest declares: 3.0.1 for the cuts of
 * `BPIG_22April` (and the hand edits of those), 3.0.0 for `catalog-300` and for the four edits of
 * `simple`.
 */
const catalogVersions: readonly (readonly [(typeof catalogNames)[number], "3.0.0" | "3.0.1"])[] = [
  ["cut-catalog-supports", "3.0.1"],
  ["cut-catalog-multiple", "3.0.1"],
  ["cut-catalog-nodes", "3.0.1"],
  ["cut-catalog-reference", "3.0.1"],
  ["cut-catalog-rubric", "3.0.1"],
  ["catalog-300", "3.0.0"],
  ["catalog-hosts", "3.0.1"],
  ["card-files", "3.0.0"],
  ["catalog-padded", "3.0.0"],
  ["catalog-lang", "3.0.0"],
  ["card-qti-content", "3.0.1"],
  ["card-gap-inside", "3.0.1"],
  ["card-empty", "3.0.1"],
  ["entry-empty", "3.0.1"],
];

/**
 * How many times `needle` occurs in `text`.
 *
 * @param text - The text to search.
 * @param needle - The text to count.
 * @returns The number of non-overlapping occurrences.
 */
const occurrences = (text: string, needle: string): number => text.split(needle).length - 1;

/**
 * The `schemaversion` each companion positive's manifest declares: 3.0.1 for `companion-301` and
 * 3.0.0 for the other three, cut from `testWithLti`'s 3.0.0 item.
 */
const companionVersions: readonly (readonly [
  (typeof companionNames)[number],
  "3.0.0" | "3.0.1",
])[] = [
  ["cut-companion", "3.0.0"],
  ["companion-301", "3.0.1"],
  ["companion-full", "3.0.0"],
  ["companion-padded", "3.0.0"],
];

/**
 * For each of the catalog positives, a file of its package and the text its edit put there (or, for
 * a cut, the text the corpus item holds).
 */
const catalogPresent: readonly (readonly [(typeof catalogNames)[number], string, string])[] = [
  ["cut-catalog-supports", "items/CatalogWithMultipleSupports.xml", '<qti-catalog id="catalog1">'],
  ["cut-catalog-multiple", "items/MultipleCatalogs.xml", '<qti-catalog id="cat123_2">'],
  ["cut-catalog-nodes", "items/CatalogsAcrossContentNodes.xml", '<qti-catalog id="i123_rb1_cat1">'],
  ["cut-catalog-reference", "items/ReferencingCatalogContent.xml", 'data-catalog-idref="catalog1"'],
  ["cut-catalog-rubric", "items/rubric_block.xml", '<qti-catalog id="catchoicedirs">'],
  ["catalog-300", "items/CatalogWithMultipleSupports.xml", "imsqti_asiv3p0_v1p0.xsd"],
  ["catalog-hosts", "items/BG007.xml", '<qti-modal-feedback outcome-identifier="FEEDBACK"'],
  [
    "catalog-hosts",
    "items/BG007.xml",
    '<qti-template-block template-identifier="T" identifier="tb">',
  ],
  ["catalog-hosts", "items/BG007.xml", '<qti-rubric-block use="instructions" view="candidate">'],
  ["card-files", "choice.xml", '<qti-card support="ext:org.example-sign_1">'],
  ["card-files", "choice.xml", '<qti-card-entry default="1">'],
  ["card-files", "choice.xml", '<p data-catalog-idref="files1">The sign.</p>'],
  ["card-files", "imsmanifest.xml", '<file href="video/clip.mp4"/>'],
  ["catalog-padded", "choice.xml", '<qti-catalog id=" catalog1 ">'],
  ["catalog-padded", "choice.xml", '<qti-card-entry default=" true ">'],
  [
    "catalog-padded",
    "choice.xml",
    '<qti-file-href mime-type="image/&#9;png"> images/sign.png </qti-file-href>',
  ],
  ["catalog-lang", "choice.xml", '<qti-card support="linguistic-guidance" xml:lang="es">'],
  ["catalog-lang", "choice.xml", '<span xml:lang="fr">exact</span>'],
  ["catalog-lang", "imsmanifest.xml", "<imsmd:language>en</imsmd:language>"],
  [
    "card-qti-content",
    "items/CatalogWithMultipleSupports.xml",
    '<qti-printed-variable identifier="SHOWN"/>',
  ],
  [
    "card-qti-content",
    "items/CatalogWithMultipleSupports.xml",
    '<qti-choice-interaction response-identifier="RESPONSE2"',
  ],
  ["card-gap-inside", "items/gap-match-example-1.xml", '<qti-gap identifier="G3"/>'],
  ["card-empty", "items/CatalogWithMultipleSupports.xml", '<qti-card support="spoken"/>'],
  ["entry-empty", "items/CatalogWithMultipleSupports.xml", '<qti-card-entry xml:lang="en"/>'],
];

/**
 * The `schemaversion` each PCI positive's manifest declares: 3.0.1 for the five that use what 3.0.1
 * adds (the built-in `QTI_CONTEXT`, a `qti-stylesheet`, a `qti-catalog-info` or a custom
 * interaction), 3.0.0 for the corpus's own and the three hand-written packages that need no more.
 */
const pciVersions: readonly (readonly [(typeof pciNames)[number], "3.0.0" | "3.0.1"])[] = [
  ["pci-simple", "3.0.0"],
  ["pci-modules", "3.0.0"],
  ["pci-configurations", "3.0.0"],
  ["pci-variables", "3.0.0"],
  ["pci-3-0-1", "3.0.1"],
  ["pci-context-3-0-1", "3.0.1"],
  ["pci-catalog-3-0-1", "3.0.1"],
  ["pci-markup-content", "3.0.0"],
  ["template-foreign", "3.0.0"],
  ["custom-3-0-1", "3.0.1"],
];

/**
 * The item of each PCI positive, and the files its package holds beside the manifest, sorted.
 */
const pciPackages: readonly (readonly [(typeof pciNames)[number], string, readonly string[]])[] = [
  [
    "pci-simple",
    "measuring_ph.xml",
    [
      "ammonia.svg",
      "baking_soda.svg",
      "measuring_ph.xml",
      "modules/module_resolution.js",
      "modules/tap.js",
      "vinegar.svg",
    ],
  ],
  [
    "pci-modules",
    "fractions_deps.xml",
    [
      "fractions_deps.xml",
      "modules/lib/eve.js",
      "modules/lib/handlebars.min-latest.js",
      "modules/shading_deps.js",
    ],
  ],
  [
    "pci-configurations",
    "fractions_deps_2.xml",
    [
      "fractions_deps_2.xml",
      "modules/hmh_co_com.js",
      "modules/hmh_co_com_fallback.json",
      "modules/lib/eve.js",
      "modules/lib/jquery-2.2.2.min.js",
      "modules/shading_deps.js",
    ],
  ],
  ...(
    [
      "pci-variables",
      "pci-3-0-1",
      "pci-context-3-0-1",
      "pci-catalog-3-0-1",
      "pci-markup-content",
      "template-foreign",
      "custom-3-0-1",
    ] as const
  ).map((name): readonly [(typeof pciNames)[number], string, readonly string[]] => [
    name,
    "measuring_ph.xml",
    [
      "ammonia.svg",
      "baking_soda.svg",
      "measuring_ph.xml",
      ...(name === "pci-3-0-1" ? ["pci.css"] : []),
      "modules/module_resolution.js",
      "modules/tap.js",
      "vinegar.svg",
    ].toSorted(),
  ]),
];

/**
 * For each of the PCI positives, a text its item holds, which its edit put there or the corpus
 * wrote.
 */
const pciPresent: readonly (readonly [(typeof pciNames)[number], string])[] = [
  ["pci-simple", '<qti-portable-custom-interaction response-identifier="RESPONSE" module="tap"'],
  ["pci-simple", '<div role="grid">'],
  ["pci-modules", '<qti-interaction-module id="shadingD" primary-path="modules/shading_deps.js"/>'],
  ["pci-configurations", 'primary-configuration="modules/hmh_co_com.js"'],
  ["pci-configurations", 'secondary-configuration="modules/hmh_co_com_fallback.json"'],
  ["pci-variables", '<qti-response-declaration identifier="RECORD" cardinality="record"/>'],
  [
    "pci-variables",
    '<qti-response-declaration identifier="PICKED" cardinality="multiple" base-type="identifier"/>',
  ],
  ["pci-variables", "<qti-prompt><p>Tap</p></qti-prompt>"],
  ["pci-variables", '<qti-template-variable template-identifier="T"/>'],
  ["pci-variables", '<qti-context-variable identifier="CTX"/>'],
  ["pci-3-0-1", '<qti-context-variable identifier="QTI_CONTEXT"/>'],
  ["pci-3-0-1", '<qti-stylesheet href="pci.css" type="text/css"/>'],
  ["pci-context-3-0-1", '<qti-context-declaration identifier="QTI_CONTEXT" cardinality="record"/>'],
  ["pci-context-3-0-1", '<qti-context-variable identifier="LEVEL"/>'],
  ["pci-catalog-3-0-1", '<qti-catalog id="tap-help">'],
  ["pci-markup-content", '<qti-printed-variable identifier="SCORE"/>'],
  ["pci-markup-content", "<template/><template/></qti-interaction-markup>"],
  ["template-foreign", '<template><x:widget xmlns:x="urn:example:widget" size="3"/></template>'],
  ["custom-3-0-1", '<qti-custom-interaction response-identifier="RESPONSE"/>'],
];

/**
 * The item of each PCI negative, the `schemaversion` its manifest declares and a text its edit put
 * there, in the order of {@link pciNegativeNames}.
 */
const pciNegativeRows: readonly (readonly [
  (typeof pciNegativeNames)[number],
  string,
  "3.0.0" | "3.0.1",
  string,
])[] = [
  [
    "pci-no-module",
    "measuring_ph.xml",
    "3.0.0",
    '<qti-portable-custom-interaction response-identifier="RESPONSE" custom-interaction-type-identifier="urn-fdc-hmhco.com-pci-tapToReveal">',
  ],
  [
    "custom-3-0-0",
    "measuring_ph.xml",
    "3.0.0",
    '<qti-custom-interaction response-identifier="RESPONSE"/>',
  ],
  [
    "pci-context-builtin-3-0-0",
    "measuring_ph.xml",
    "3.0.0",
    '<qti-context-variable identifier="QTI_CONTEXT"/>',
  ],
  [
    "pci-context-undeclared",
    "measuring_ph.xml",
    "3.0.0",
    '<qti-context-variable identifier="CTX"/>',
  ],
  [
    "pci-context-undeclared-3-0-1",
    "measuring_ph.xml",
    "3.0.1",
    '<qti-context-variable identifier="LEVEL"/>',
  ],
  [
    "pci-template-undeclared",
    "measuring_ph.xml",
    "3.0.0",
    '<qti-template-variable template-identifier="T"/>',
  ],
  [
    "pci-no-type",
    "measuring_ph.xml",
    "3.0.0",
    '<qti-portable-custom-interaction response-identifier="RESPONSE" module="tap">',
  ],
  [
    "pci-two-modules",
    "measuring_ph.xml",
    "3.0.0",
    "</qti-interaction-modules><qti-interaction-modules>",
  ],
  ["pci-modules-empty", "measuring_ph.xml", "3.0.0", "<qti-interaction-modules/>"],
  [
    "pci-no-markup",
    "measuring_ph.xml",
    "3.0.0",
    'custom-interaction-type-identifier="urn-fdc-hmhco.com-pci-tapToReveal"></qti-portable-custom-interaction>',
  ],
  [
    "pci-two-markups",
    "measuring_ph.xml",
    "3.0.0",
    "</qti-interaction-markup><qti-interaction-markup>",
  ],
  [
    "pci-markup-order",
    "measuring_ph.xml",
    "3.0.0",
    '<qti-template-variable template-identifier="T"/><qti-interaction-markup>',
  ],
  [
    "pci-modules-after-markup",
    "measuring_ph.xml",
    "3.0.0",
    "</qti-interaction-markup><qti-interaction-modules>",
  ],
  ["pci-prompt-late", "measuring_ph.xml", "3.0.0", "</qti-interaction-markup><qti-prompt>"],
  [
    "pci-markup-text",
    "measuring_ph.xml",
    "3.0.0",
    "<qti-interaction-markup>Tap</qti-interaction-markup>",
  ],
  [
    "pci-stylesheet-3-0-0",
    "measuring_ph.xml",
    "3.0.0",
    '<qti-stylesheet href="pci.css" type="text/css"/>',
  ],
  ["pci-catalog-info-3-0-0", "measuring_ph.xml", "3.0.0", '<qti-catalog id="tap-help">'],
  [
    "template-outside",
    "measuring_ph.xml",
    "3.0.0",
    "</qti-interaction-markup><template/></qti-portable-custom-interaction>",
  ],
  ["pci-nested", "measuring_ph.xml", "3.0.0", '<qti-response-declaration identifier="INNER"'],
  ["pci-type-malformed", "measuring_ph.xml", "3.0.0", 'custom-interaction-type-identifier="a%zz"'],
  ["pci-path-malformed", "measuring_ph.xml", "3.0.0", 'primary-path="modules/ta%zzp.js"'],
  ["pci-module-malformed", "measuring_ph.xml", "3.0.0", 'module="1shading"'],
  ["pci-module-id-malformed", "measuring_ph.xml", "3.0.0", '<qti-interaction-module id="1shading"'],
  ["custom-attribute", "measuring_ph.xml", "3.0.1", 'xmlns:x="urn:example:widget" x:mode="draw"'],
  [
    "pci-items-fallback",
    "fractions_deps_2.xml",
    "3.0.0",
    'fallback-configuration="modules/hmh_co_com_fallback.json"',
  ],
  ["pci-items-unlisted", "fractions_deps.xml", "3.0.0", '<qti-interaction-module id="raphael"'],
  ["pci-items-missing", "fractions_deps.xml", "3.0.0", '<qti-interaction-module id="raphael"'],
  [
    "pci-configuration-missing",
    "fractions_deps_2.xml",
    "3.0.0",
    'primary-configuration="modules/hmh_co_comXX.js"',
  ],
];

/**
 * The files the package of a hand-written PCI negative holds beside the manifest.
 */
const pciNegativeStandard = [
  "ammonia.svg",
  "baking_soda.svg",
  "measuring_ph.xml",
  "modules/module_resolution.js",
  "modules/tap.js",
  "vinegar.svg",
] as const;

/**
 * The files the cuts of `fractions_deps_2.xml` hold beside the manifest, which are
 * `pci-configurations`' files.
 */
const pciConfigurationsHeld = [
  "fractions_deps_2.xml",
  "modules/hmh_co_com.js",
  "modules/hmh_co_com_fallback.json",
  "modules/lib/eve.js",
  "modules/lib/jquery-2.2.2.min.js",
  "modules/shading_deps.js",
] as const;

/**
 * The files the cuts of `fractions_deps.xml` hold beside the manifest, which are `pci-modules`'
 * files.
 */
const pciModulesHeld = [
  "fractions_deps.xml",
  "modules/lib/eve.js",
  "modules/lib/handlebars.min-latest.js",
  "modules/shading_deps.js",
] as const;

/**
 * The files each PCI negative's package holds beside the manifest, when they are not the standard
 * ones, and the files its manifest lists, when they are not the files it holds: the corpus cuts
 * break the pairing in one file each (`pci-items-unlisted` holds the handlebars file its manifest
 * does not list, `pci-items-missing` lists `raphael.js` with no file behind it).
 */
const pciNegativeFiles: Readonly<
  Partial<
    Record<
      (typeof pciNegativeNames)[number],
      { readonly held: readonly string[]; readonly listed?: readonly string[] }
    >
  >
> = {
  "pci-configuration-missing": { held: pciConfigurationsHeld },
  "pci-items-fallback": { held: pciConfigurationsHeld },
  "pci-items-missing": {
    held: pciModulesHeld,
    listed: [...pciModulesHeld, "modules/lib/raphael.js"].toSorted(),
  },
  "pci-items-unlisted": {
    held: pciModulesHeld,
    listed: pciModulesHeld.filter((file) => file !== "modules/lib/handlebars.min-latest.js"),
  },
  "pci-stylesheet-3-0-0": { held: [...pciNegativeStandard, "pci.css"].toSorted() },
};

/**
 * For each XML-path negative, a file of its package and the text its edit put there.
 */
const catalogNegativePresent: readonly (readonly [
  (typeof catalogNegativeNames)[number],
  string,
  string,
])[] = [
  [
    "support-twice",
    "items/CatalogWithMultipleSupports.xml",
    '<qti-card support="keyword-translation"><qti-html-content>Read aloud.',
  ],
  [
    "default-twice",
    "items/CatalogWithMultipleSupports.xml",
    '<qti-card-entry xml:lang="de" default="1">',
  ],
  [
    "idref-html",
    "items/CatalogWithMultipleSupports.xml",
    '<span id="html1" data-catalog-idref="html1">',
  ],
  ["idref-missing", "items/CatalogWithMultipleSupports.xml", 'data-catalog-idref="nowhere"'],
  [
    "catalog-id-twice",
    "items/CatalogWithMultipleSupports.xml",
    '<qti-catalog id="catalog1"><qti-card support="spoken">',
  ],
  [
    "catalog-no-id",
    "items/CatalogWithMultipleSupports.xml",
    '<qti-catalog><qti-card support="spoken">',
  ],
  ["card-file-no-type", "choice.xml", "<qti-file-href>images/sign.png</qti-file-href>"],
  ["info-empty", "choice.xml", "<qti-catalog-info/>"],
  ["catalog-empty", "choice.xml", '<qti-catalog id="c1"></qti-catalog>'],
  [
    "card-mixed",
    "items/CatalogWithMultipleSupports.xml",
    '<qti-card support="spoken"><qti-html-content>Read aloud.</qti-html-content><qti-card-entry',
  ],
  [
    "html-twice",
    "items/CatalogWithMultipleSupports.xml",
    "</qti-html-content><qti-html-content>Read it twice.",
  ],
  [
    "card-file-first",
    "choice.xml",
    '<qti-file-href mime-type="image/png">images/sign.png</qti-file-href><qti-html-content>',
  ],
  [
    "physical-first",
    "elements.xml",
    "<qti-companion-materials-info><qti-physical-material>Scratch paper</qti-physical-material>",
  ],
  [
    "calculator-no-description",
    "elements.xml",
    "<qti-calculator-type>basic</qti-calculator-type></qti-calculator>",
  ],
  ["two-infos", "elements.xml", "</qti-calculator-info><qti-calculator-info>"],
  ["rule-both-systems", "elements.xml", "</qti-rule-system-si><qti-rule-system-us>"],
  ["default-default", "items/CatalogWithMultipleSupports.xml", 'default="yes"'],
  ["support-case", "items/CatalogWithMultipleSupports.xml", '<qti-card support="Spoken">'],
  ["support-ext-empty", "items/CatalogWithMultipleSupports.xml", '<qti-card support="ext:">'],
  ["calculator-Basic", "elements.xml", "<qti-calculator-type>Basic</qti-calculator-type>"],
  ["unit-case", "elements.xml", '<qti-major-increment unit="meter">'],
  ["increment-text", "elements.xml", '<qti-major-increment unit="Meter">one</qti-major-increment>'],
  ["rule-system-SI", "elements.xml", "<qti-rule-system-SI>"],
  ["card-file-missing", "choice.xml", "images/absent.png</qti-file-href>"],
  ["icon-missing", "choice.xml", "<qti-resource-icon>images/absent.svg</qti-resource-icon>"],
  ["card-file-undescribed", "choice.xml", "images/unlisted.png</qti-file-href>"],
  [
    "card-interaction-in-modal",
    "items/BG007.xml",
    '<p>Done: <qti-text-entry-interaction response-identifier="RESPONSE2"/></p>',
  ],
  ["card-gap-outside", "items/CatalogWithMultipleSupports.xml", '<qti-gap identifier="G1"/>'],
  ["body-lang", "choice.xml", '<p xml:lang="es" data-catalog-idref="catalog1">'],
];

/**
 * The negatives whose package deliberately lists a file it lacks (`missing`) or holds a file its
 * manifest does not list (`undescribed`), each with that file's path.
 */
const catalogNegativeFiles = {
  missing: [
    ["card-file-missing", "images/absent.png"],
    ["icon-missing", "images/absent.svg"],
  ],
  undescribed: [["card-file-undescribed", "images/unlisted.png"]],
} as const;

/**
 * The paths a manifest lists as `file`s, each once.
 *
 * @param manifest - A manifest's text.
 * @returns The listed paths, sorted.
 */
const listedFilesOf = (manifest: string): string[] =>
  [
    ...new Set(
      [...manifest.matchAll(/<file href="(?<href>[^"]*)"/gu)].map(
        (match) => match.groups?.["href"] ?? "",
      ),
    ),
  ].toSorted();

/**
 * BegGuide's test, cut with the documents it reaches.
 */
const begGuideCut: FixtureSpec = {
  edits: [{ _tag: "cutTest", schemaversion: "3.0.1", test: "BGtest.xml" }],
  member: "QTI3_BeginnersGuide_Examples/BegGuide_March2025.zip",
  name: "cut-test-begguide",
};

/**
 * The corpus's loose `rtest13.xml`, packaged with one generated stub item per item `href`.
 */
const looseRtest13: FixtureSpec = {
  edits: [
    {
      _tag: "looseTest",
      schemaversion: "3.0.0",
      test: "qtiv3-examples/tests/rtest13.xml",
    },
  ],
  member: "qtiv3-examples/tests/rtest13.xml",
  name: "loose-test-rtest13",
};

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

  it.effect("cut-drawing keeps the file its srcset names, and its manifest lists it", () =>
    inFreshRoot(() =>
      Effect.gen(function* cutDrawing() {
        const fs = yield* FileSystem.FileSystem;
        const dir = yield* materialize("cut-drawing");

        assert.isTrue(yield* fs.exists(`${dir}/items/images/anglePQR.svg`), "anglePQR.svg kept");
        assert.include(
          yield* fs.readFileString(`${dir}/imsmanifest.xml`),
          "items/images/anglePQR.svg",
          "manifest lists anglePQR.svg",
        );
      }),
    ),
  );

  it.effect("a cut keeps the file only an altimg names, and its manifest lists it", () =>
    inFreshRoot(() =>
      Effect.gen(function* cutAltimg() {
        const fs = yield* FileSystem.FileSystem;
        const spec: FixtureSpec = {
          ...specOf("cut-drawing"),
          edits: [
            {
              _tag: "ReplaceText",
              file: "items/drawing-interaction-1.xml",
              replacement: 'altimg="images/anglePQR.svg"',
              search: 'srcset="images/anglePQR.svg"',
            },
            ...specOf("cut-drawing").edits,
          ],
          name: "cut-altimg",
        };
        const dir = yield* materializeSpec(spec);

        assert.isTrue(yield* fs.exists(`${dir}/items/images/anglePQR.svg`), "anglePQR.svg kept");
        assert.include(
          yield* fs.readFileString(`${dir}/imsmanifest.xml`),
          "items/images/anglePQR.svg",
          "manifest lists anglePQR.svg",
        );
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
  it.effect(
    "cutTest keeps the test, its six items and the four media files, each listed once",
    () =>
      inFreshRoot(() =>
        Effect.gen(function* cutTestPackage() {
          const fs = yield* FileSystem.FileSystem;
          const dir = yield* materializeSpec(begGuideCut);
          const manifest = yield* fs.readFileString(`${dir}/imsmanifest.xml`);
          const test = yield* fs.readFileString(`${dir}/BGtest.xml`);
          const resources = resourcesOf(manifest);
          const files = yield* filesOf(dir);
          const listed = resources.flatMap((resource) => resource.files);

          assert.deepStrictEqual(
            resources.map((resource) => [resource.type, resource.href]),
            [
              ["imsqti_test_xmlv3p0", "BGtest.xml"],
              ["imsqti_item_xmlv3p0", "items/firstexample.xml"],
              ["imsqti_item_xmlv3p0", "items/BG007.xml"],
              ["imsqti_item_xmlv3p0", "items/BG008.xml"],
              ["imsqti_item_xmlv3p0", "items/BG009.xml"],
              ["imsqti_item_xmlv3p0", "items/BG010.xml"],
              ["imsqti_item_xmlv3p0", "items/BG011.xml"],
            ],
          );
          assert.strictEqual(new Set(resources.map((resource) => resource.identifier)).size, 7);
          assert.include(manifest, "<schemaversion>3.0.1</schemaversion>");

          for (const href of itemHrefsOf(test)) {
            assert.include(files, href);
          }

          assert.deepStrictEqual(
            resources.find((resource) => resource.href === "items/BG011.xml")?.files.toSorted(),
            [
              "items/BG011.xml",
              "items/resources/crow_movie.mp4",
              "items/resources/crow_movie.ogg",
              "items/resources/crows.jpg",
              "items/resources/subtitles_en.vtt",
            ],
          );
          assert.deepStrictEqual(
            files.filter((file) => file !== "imsmanifest.xml"),
            [...new Set(listed)].toSorted(),
          );
          assert.deepStrictEqual(
            files.toSorted(),
            [...new Set(listed), "imsmanifest.xml"].toSorted(),
          );
          assert.notInclude(files, "items/BG007.xml.bak");
        }),
      ),
  );

  it.effect("looseTest packages rtest13 with one stub per item href declaring its variables", () =>
    inFreshRoot(() =>
      Effect.gen(function* looseTestPackage() {
        const fs = yield* FileSystem.FileSystem;
        const dir = yield* materializeSpec(looseRtest13);
        const manifest = yield* fs.readFileString(`${dir}/imsmanifest.xml`);
        const test = yield* fs.readFileString(`${dir}/rtest13.xml`);
        const resources = resourcesOf(manifest);
        const files = yield* filesOf(dir);
        const hrefs = itemHrefsOf(test);

        assert.strictEqual(hrefs.length, 6);
        assert.deepStrictEqual(
          resources.map((resource) => [resource.type, resource.href]),
          [
            ["imsqti_test_xmlv3p0", "rtest13.xml"],
            ...hrefs.map((href) => ["imsqti_item_xmlv3p0", href]),
          ],
        );

        for (const href of hrefs) {
          assert.include(files, href);
        }

        assert.deepStrictEqual(
          files,
          [...resources.flatMap((resource) => resource.files), "imsmanifest.xml"]
            .filter((file, at, all) => all.indexOf(file) === at)
            .toSorted(),
        );

        const stub = yield* fs.readFileString(`${dir}/item034.xml`);

        assert.include(stub, 'identifier="item034"');
        assert.match(
          stub,
          /<qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier"/u,
        );
        assert.match(
          stub,
          /<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/u,
        );
        assert.notInclude(stub, "sign.png");
        assert.notInclude(stub, 'identifier="xml"');
      }),
    ),
  );
  it.effect(
    "each positive fixture of phase 5 lists every packaged file and holds QTI documents that parse",
    () =>
      inFreshRoot(() =>
        Effect.gen(function* positiveFixtures() {
          const fs = yield* FileSystem.FileSystem;

          for (const [name, version] of positiveVersions) {
            const dir = yield* materialize(name);
            const files = yield* filesOf(dir);
            const manifest = yield* fs.readFileString(`${dir}/imsmanifest.xml`);

            assert.include(manifest, `<schemaversion>${version}</schemaversion>`, name);
            assert.deepStrictEqual(
              files.filter((file) => file !== "imsmanifest.xml"),
              listedFilesOf(manifest),
              name,
            );

            for (const file of files) {
              const isDocument =
                file.endsWith(".xml") &&
                file !== "imsmanifest.xml" &&
                !file.startsWith("adaptive/") &&
                !file.startsWith("links/");

              if (isDocument) {
                const document = yield* readXml(yield* fs.readFile(`${dir}/${file}`));

                assert.strictEqual(document.root.namespace, qtiNamespace, `${name}/${file}`);
              }
            }
          }
        }),
      ),
    120_000,
  );

  it.effect("test-mapping's stubs: I is time-dependent with A.B, J declares no K.SCORE", () =>
    inFreshRoot(() =>
      Effect.gen(function* mappingStubs() {
        const fs = yield* FileSystem.FileSystem;
        const dir = yield* materialize("test-mapping");
        const test = yield* fs.readFileString(`${dir}/rtest26.xml`);
        const timed = yield* fs.readFileString(`${dir}/itemI.xml`);
        const shared = yield* fs.readFileString(`${dir}/itemJ.xml`);

        for (const identifier of ["J", "J.K"]) {
          assert.include(
            test,
            `<qti-assessment-item-ref identifier="${identifier}" href="itemJ.xml"/>`,
          );
        }

        assert.include(test, '<qti-variable identifier="J.K.SCORE"/>');
        assert.include(timed, 'time-dependent="true"');
        assert.include(timed, '<qti-variable identifier="duration"/>');
        assert.include(timed, 'identifier="A.B" cardinality="single" base-type="float"');
        assert.include(shared, 'time-dependent="false"');
        assert.include(shared, 'identifier="SCORE" cardinality="single" base-type="float"');
        assert.notInclude(shared, 'identifier="K.SCORE"');
        assert.notInclude(shared, 'identifier="K"');
      }),
    ),
  );

  it.effect(
    "test-section-ref has two tests reaching one section document and one that none reaches",
    () =>
      inFreshRoot(() =>
        Effect.gen(function* sectionRefs() {
          const fs = yield* FileSystem.FileSystem;
          const dir = yield* materialize("test-section-ref");
          const first = yield* fs.readFileString(`${dir}/rtest01.xml`);
          const second = yield* fs.readFileString(`${dir}/test-b.xml`);
          const manifest = yield* fs.readFileString(`${dir}/imsmanifest.xml`);
          const types = [...manifest.matchAll(/type="(?<type>[^"]*)"/gu)].map(
            (match) => match.groups?.["type"],
          );

          for (const test of [first, second]) {
            assert.include(test, 'href="sections/shared.xml"');
            assert.notInclude(test, "lonely");
          }

          assert.strictEqual(types.filter((type) => type === "imsqti_test_xmlv3p0").length, 2);
          assert.strictEqual(types.filter((type) => type === "imsqti_section_xmlv3p0").length, 2);
          assert.include(first, 'identifier="I2.SCORE"');
          assert.notInclude(second, 'identifier="I2.SCORE"');
          assert.include(second, '<qti-assessment-item-ref identifier="I2"');
        }),
      ),
  );

  it.effect("the 60 negative names are the spec's list, each in the fixture table", () =>
    Effect.sync(() => {
      assert.deepStrictEqual([...negativeNames], [...expectedNegativeNames]);
      assert.strictEqual(new Set(negativeNames).size, 60);
      assert.includeMembers([...fixtureNames], [...negativeNames]);

      for (const name of negativeNames) {
        assert.notInclude(
          positiveVersions.map(([positive]) => positive),
          name,
        );
      }
    }),
  );

  it.effect("only the four direct negatives carry a positive's edits unchanged", () =>
    Effect.sync(() => {
      const unchanged = negativeNames.filter((name) =>
        positiveVersions.some(
          ([positive]) =>
            JSON.stringify(specOf(positive).edits) === JSON.stringify(specOf(name).edits) &&
            specOf(positive).member === specOf(name).member,
        ),
      );

      assert.deepStrictEqual(
        [...unchanged],
        [
          "duration-of-item-ref",
          "instance-spelling-canonical",
          "item-prefixed",
          "section-variable-in-test",
        ],
      );
    }),
  );

  it.effect(
    "each negative fixture materializes, lists every packaged file and holds QTI documents that parse",
    () =>
      inFreshRoot(() =>
        Effect.gen(function* negativeFixtures() {
          const fs = yield* FileSystem.FileSystem;

          for (const name of negativeNames) {
            const dir = yield* materialize(name);
            const files = yield* filesOf(dir);
            const manifest = yield* fs.readFileString(`${dir}/imsmanifest.xml`);

            assert.deepStrictEqual(
              files.filter((file) => file !== "imsmanifest.xml"),
              listedFilesOf(manifest),
              name,
            );

            for (const file of files) {
              const isDocument =
                file.endsWith(".xml") &&
                file !== "imsmanifest.xml" &&
                !file.startsWith("adaptive/");

              if (isDocument) {
                const document = yield* readXml(yield* fs.readFile(`${dir}/${file}`));

                assert.strictEqual(document.root.namespace, qtiNamespace, `${name}/${file}`);
              }
            }
          }
        }),
      ),
    testTimeoutMs,
  );

  it.effect(
    "each negative holds its breach in the file the spec's edit names",
    () =>
      inFreshRoot(() =>
        Effect.gen(function* breachesPresent() {
          const fs = yield* FileSystem.FileSystem;

          for (const [name, file, needle] of negativeBreaches) {
            const dir = yield* materialize(name);

            assert.include(yield* fs.readFileString(`${dir}/${file}`), needle, `${name}: ${file}`);
          }

          for (const [name, file, needle] of negativeRemovals) {
            const dir = yield* materialize(name);

            assert.notInclude(
              yield* fs.readFileString(`${dir}/${file}`),
              needle,
              `${name}: ${file}`,
            );
          }

          const twice = yield* fs.readFileString(
            `${yield* materialize("stimulus-ref-duplicate")}/exemplar06.xml`,
          );
          const part = yield* fs.readFileString(`${yield* materialize("part-order")}/rtest13.xml`);
          const images = yield* filesOf(yield* materialize("stimulus-missing-image"));
          const noPart = yield* fs.readFileString(
            `${yield* materialize("test-no-part")}/rtest13.xml`,
          );

          assert.strictEqual(
            twice.split('<qti-assessment-stimulus-ref identifier="Stimulus1"').length,
            3,
          );
          assert.isAbove(
            part.indexOf('<qti-item-session-control show-feedback="true"'),
            part.indexOf('<qti-assessment-section identifier="sectionA"'),
          );
          assert.notInclude(images, "passages/images/apip_VE_IP_05_croc.png");
          assert.notInclude(images, "passages/images/apip_VE_IP_05_flamingos.png");
          assert.notInclude(noPart, "<qti-test-part");
        }),
      ),
    testTimeoutMs,
  );

  it.effect(
    "test-mapping's hand-written stubs: J declares K.SCORE beside SCORE",
    () =>
      inFreshRoot(() =>
        Effect.gen(function* handStubs() {
          const fs = yield* FileSystem.FileSystem;
          const ambiguous = yield* fs.readFileString(
            `${yield* materialize("prefixed-ambiguous")}/itemJ.xml`,
          );

          assert.include(ambiguous, 'identifier="K.SCORE" cardinality="single" base-type="float"');
          assert.include(ambiguous, 'identifier="SCORE" cardinality="single" base-type="float"');
        }),
      ),
    testTimeoutMs,
  );

  it.effect("extmeta's record keeps the two xml:lang attributes the published file carries", () =>
    inFreshRoot(() =>
      Effect.gen(function* externalRecordLang() {
        const fs = yield* FileSystem.FileSystem;
        const record = yield* fs.readFileString(`${yield* materialize("extmeta")}/meta/choice.xml`);

        assert.include(record, '<string xml:lang="en">jacs</string>');
        assert.include(record, '<string xml:lang="en">Mathematics</string>');
      }),
    ),
  );

  it.effect(
    "the restored-check and assembly names are the brief's lists, each in the fixture table",
    () =>
      Effect.sync(() => {
        assert.deepStrictEqual(
          [...restoredNames],
          [
            "aria-h1-role-button",
            "aria-source-role",
            "lang-case-mismatch",
            "pattern-unresolved-item",
            "pattern-unresolved-test",
          ],
        );
        assert.deepStrictEqual(
          [...assemblyNames],
          [
            "section-doc-twice",
            "section-doc-name-clash",
            "branch-backward-shuffled",
            "branch-to-own-section",
            "select-two-required",
            "branch-in-twice-placed-section",
          ],
        );
        assert.strictEqual(new Set(restoredNames).size, 5);
        assert.strictEqual(new Set(assemblyNames).size, 6);
        assert.includeMembers([...fixtureNames], [...restoredNames, ...assemblyNames]);

        for (const name of [...restoredNames, ...assemblyNames]) {
          assert.notInclude([...negativeNames], name);
          assert.notInclude(
            positiveVersions.map(([positive]) => positive),
            name,
          );
        }

        assert.strictEqual(
          new Set([...negativeNames, ...restoredNames, ...assemblyNames]).size,
          negativeNames.length + restoredNames.length + assemblyNames.length,
        );
      }),
  );

  it.effect(
    "each restored-check and assembly fixture materializes, lists every packaged file, holds QTI documents that parse and carries its edit",
    () =>
      inFreshRoot(() =>
        Effect.gen(function* restoredAndAssemblyFixtures() {
          const fs = yield* FileSystem.FileSystem;

          for (const name of [...restoredNames, ...assemblyNames]) {
            const dir = yield* materialize(name);
            const files = yield* filesOf(dir);
            const manifest = yield* fs.readFileString(`${dir}/imsmanifest.xml`);

            assert.deepStrictEqual(
              files.filter((file) => file !== "imsmanifest.xml"),
              listedFilesOf(manifest),
              name,
            );

            for (const file of files) {
              if (file.endsWith(".xml") && file !== "imsmanifest.xml") {
                const document = yield* readXml(yield* fs.readFile(`${dir}/${file}`));

                assert.strictEqual(document.root.namespace, qtiNamespace, `${name}/${file}`);
              }
            }
          }

          for (const [name, file, needle] of restoredAndAssemblyPresent) {
            const dir = yield* materialize(name);

            assert.include(yield* fs.readFileString(`${dir}/${file}`), needle, `${name}: ${file}`);
          }
        }),
      ),
    testTimeoutMs,
  );

  it.effect("the pattern fixtures name a variable that no document of the package declares", () =>
    inFreshRoot(() =>
      Effect.gen(function* unresolvedPatterns() {
        const fs = yield* FileSystem.FileSystem;

        for (const name of ["pattern-unresolved-item", "pattern-unresolved-test"] as const) {
          const dir = yield* materialize(name);

          for (const file of yield* filesOf(dir)) {
            if (file.endsWith(".xml")) {
              assert.notInclude(
                yield* fs.readFileString(`${dir}/${file}`),
                'identifier="NOSUCH"',
                `${name}: ${file}`,
              );
            }
          }
        }

        const item = yield* fs.readFileString(
          `${yield* materialize("pattern-unresolved-item")}/choice.xml`,
        );

        assert.notInclude(item, "match_correct.xml");
        assert.include(item, '<qti-set-outcome-value identifier="SCORE">');
      }),
    ),
  );

  it.effect("the assembly fixtures hold their edits where their brief says", () =>
    inFreshRoot(() =>
      Effect.gen(function* assemblyEdits() {
        const fs = yield* FileSystem.FileSystem;
        const twice = yield* materialize("section-doc-twice");
        const placed = yield* fs.readFileString(`${twice}/rtest01.xml`);
        const clash = yield* fs.readFileString(
          `${yield* materialize("section-doc-name-clash")}/sections/shared.xml`,
        );
        const selection = yield* fs.readFileString(
          `${yield* materialize("select-two-required")}/rtest12.xml`,
        );
        const inDocument = yield* fs.readFileString(
          `${yield* materialize("branch-in-twice-placed-section")}/sections/shared.xml`,
        );

        assert.strictEqual(placed.split('href="sections/shared.xml"').length, 3);
        assert.notInclude(clash, 'identifier="shared-item"');
        assert.include(clash, "<qti-assessment-section ");
        assert.include(clash, 'identifier="shared" title="shared"');
        assert.notInclude(selection, "item365");
        assert.strictEqual(selection.split('required="true"').length - 1, 3);
        assert.isAbove(
          inDocument.indexOf('identifier="shared-item"'),
          inDocument.indexOf('<qti-branch-rule target="shared-item">'),
        );
      }),
    ),
  );

  it.effect(
    "the catalog names are the brief's list, each in the fixture table and no negative",
    () =>
      Effect.sync(() => {
        assert.deepStrictEqual(
          [...catalogNames],
          [
            "cut-catalog-supports",
            "cut-catalog-multiple",
            "cut-catalog-nodes",
            "cut-catalog-reference",
            "cut-catalog-rubric",
            "catalog-300",
            "catalog-hosts",
            "card-files",
            "catalog-padded",
            "catalog-lang",
            "card-qti-content",
            "card-gap-inside",
            "card-empty",
            "entry-empty",
          ],
        );
        assert.strictEqual(new Set(catalogNames).size, 14);
        assert.deepStrictEqual(
          catalogVersions.map(([name]) => name),
          [...catalogNames],
        );
        assert.includeMembers([...fixtureNames], [...catalogNames]);

        for (const name of catalogNames) {
          assert.notInclude([...negativeNames, ...restoredNames, ...assemblyNames], name);
        }
      }),
  );

  it.effect(
    "each catalog positive materializes under 2 MB, lists every packaged file, holds QTI documents that parse and carries its edit",
    () =>
      inFreshRoot(() =>
        Effect.gen(function* catalogFixtures() {
          const fs = yield* FileSystem.FileSystem;

          for (const [name, version] of catalogVersions) {
            const dir = yield* materialize(name);
            const entries = yield* fs.readDirectory(dir, { recursive: true });
            const files: string[] = [];
            let size = 0;

            for (const entry of entries) {
              const info = yield* fs.stat(`${dir}/${entry}`);

              if (info.type === "File") {
                files.push(entry);
                size += Number(info.size);
              }
            }

            const manifest = yield* fs.readFileString(`${dir}/imsmanifest.xml`);

            assert.include(manifest, `<schemaversion>${version}</schemaversion>`, name);
            assert.deepStrictEqual(
              files.filter((file) => file !== "imsmanifest.xml").toSorted(),
              listedFilesOf(manifest),
              name,
            );
            assert.isBelow(size, 2 * 1024 * 1024, name);

            for (const file of files) {
              if (file.endsWith(".xml") && file !== "imsmanifest.xml") {
                const document = yield* readXml(yield* fs.readFile(`${dir}/${file}`));

                assert.strictEqual(document.root.namespace, qtiNamespace, `${name}/${file}`);
              }
            }
          }

          for (const [name, file, needle] of catalogPresent) {
            const dir = yield* materialize(name);

            assert.include(yield* fs.readFileString(`${dir}/${file}`), needle, `${name}: ${file}`);
          }
        }),
      ),
    testTimeoutMs,
  );

  it.effect(
    "the companion names are the brief's list, each in the fixture table and no negative",
    () =>
      Effect.sync(() => {
        assert.deepStrictEqual(
          [...companionNames],
          ["cut-companion", "companion-301", "companion-full", "companion-padded"],
        );
        assert.deepStrictEqual(
          companionVersions.map(([name]) => name),
          [...companionNames],
        );
        assert.includeMembers([...fixtureNames], [...companionNames]);

        for (const name of companionNames) {
          assert.notInclude(
            [...negativeNames, ...restoredNames, ...assemblyNames, ...catalogNames],
            name,
          );
        }
      }),
  );

  it.effect(
    "each companion positive materializes under 2 MB, keeps the digital material's file and icon, lists every packaged file and carries its edit",
    () =>
      inFreshRoot(() =>
        Effect.gen(function* companionFixtures() {
          const fs = yield* FileSystem.FileSystem;

          for (const [name, version] of companionVersions) {
            const dir = yield* materialize(name);
            const entries = yield* fs.readDirectory(dir, { recursive: true });
            const files: string[] = [];
            let size = 0;

            for (const entry of entries) {
              const info = yield* fs.stat(`${dir}/${entry}`);

              if (info.type === "File") {
                files.push(entry);
                size += Number(info.size);
              }
            }

            const manifest = yield* fs.readFileString(`${dir}/imsmanifest.xml`);
            const item = yield* fs.readFileString(`${dir}/elements.xml`);

            assert.include(manifest, `<schemaversion>${version}</schemaversion>`, name);
            assert.deepStrictEqual(
              files.filter((file) => file !== "imsmanifest.xml").toSorted(),
              ["elements.xml", "links/periodicTable.xml", "links/table.svg"],
              name,
            );
            assert.deepStrictEqual(listedFilesOf(manifest), [
              "elements.xml",
              "links/periodicTable.xml",
              "links/table.svg",
            ]);
            assert.isBelow(size, 2 * 1024 * 1024, name);
            assert.include(
              item,
              '<qti-digital-material label="The Periodic Table" mime-type="text/html">',
              name,
            );
            assert.include(item, "<qti-file-href>links/periodicTable.xml</qti-file-href>", name);
            assert.include(item, "<qti-resource-icon>links/table.svg</qti-resource-icon>", name);
            assert.notInclude(item, "tool-name", name);
            assert.include(
              item,
              version === "3.0.1" ? "imsqti_asiv3p0p1_v1p0.xsd" : "imsqti_asiv3p0_v1p0.xsd",
              name,
            );

            const document = yield* readXml(yield* fs.readFile(`${dir}/elements.xml`));

            assert.strictEqual(document.root.namespace, qtiNamespace, name);
          }
        }),
      ),
    testTimeoutMs,
  );

  it.effect(
    "companion-full holds every kind of material, every calculator type and every unit value, and companion-padded pads its values",
    () =>
      inFreshRoot(() =>
        Effect.gen(function* companionContent() {
          const fs = yield* FileSystem.FileSystem;
          const read = (name: (typeof companionNames)[number]) =>
            materialize(name).pipe(
              Effect.flatMap((dir) => fs.readFileString(`${dir}/elements.xml`)),
            );
          const full = yield* read("companion-full");
          const padded = yield* read("companion-padded");

          for (const type of ["basic", "standard", "scientific", "graphing"]) {
            assert.strictEqual(
              occurrences(full, `<qti-calculator-type>${type}</qti-calculator-type>`),
              1,
            );
          }

          assert.strictEqual(occurrences(full, "<qti-calculator-info>"), 1);
          assert.strictEqual(occurrences(full, "<qti-resource-icon>"), 2);
          assert.strictEqual(occurrences(full, "<qti-rule-system-si>"), 3);
          assert.strictEqual(occurrences(full, "<qti-rule-system-us>"), 3);
          assert.strictEqual(occurrences(full, "<qti-increment-si>"), 2);
          assert.strictEqual(occurrences(full, "<qti-increment-us>"), 2);
          assert.strictEqual(occurrences(full, "<qti-physical-material>"), 2);
          assert.strictEqual(occurrences(full, "<qti-digital-material"), 2);
          assert.strictEqual(occurrences(full, "<qti-digital-material>"), 1);

          for (const unit of [
            "Millimeter",
            "Centimeter",
            "Meter",
            "Kilometer",
            "Inch",
            "Foot",
            "Yard",
            "Mile",
            "Radian",
            "Degree",
            "Minute",
            "Second",
          ]) {
            assert.include(full, `unit="${unit}"`, unit);
          }

          assert.strictEqual(occurrences(full, "<qti-minor-increment"), 6);
          assert.include(padded, '<qti-major-increment unit="Meter"> 1.5 </qti-major-increment>');
          assert.include(padded, "<qti-minimum-length> 30 </qti-minimum-length>");
          assert.include(padded, "A ruler&#9;of one metre");
        }),
      ),
    testTimeoutMs,
  );

  it.effect(
    "the XML-path negative names are the spec's 29, with a verdict row each, and the empty card and entry are no negatives",
    () =>
      Effect.sync(() => {
        assert.strictEqual(catalogNegativeNames.length, 29);
        assert.strictEqual(new Set(catalogNegativeNames).size, 29);
        assert.deepStrictEqual(
          catalogVerdicts.map(([name]) => name),
          [...catalogNegativeNames],
        );
        assert.deepStrictEqual(
          [...new Set(catalogNegativePresent.map(([name]) => name))],
          [...catalogNegativeNames],
        );
        assert.includeMembers([...fixtureNames], [...catalogNegativeNames]);

        for (const [name, rules] of catalogVerdicts) {
          assert.isAbove(rules.length, 0, name);
          assert.strictEqual(new Set(rules).size, rules.length, name);
        }

        for (const name of catalogNegativeNames) {
          assert.notInclude(
            [
              ...negativeNames,
              ...restoredNames,
              ...assemblyNames,
              ...catalogNames,
              ...companionNames,
            ],
            name,
          );
        }

        assert.notInclude([...catalogNegativeNames], "card-empty");
        assert.notInclude([...catalogNegativeNames], "entry-empty");
        assert.includeMembers([...catalogNames], ["card-empty", "entry-empty"]);
      }),
  );

  it.effect(
    "each XML-path negative materializes under 2 MB, holds XML documents that parse, carries its edit and breaks nothing the manifest lists beyond its own file",
    () =>
      inFreshRoot(() =>
        Effect.gen(function* catalogNegatives() {
          const fs = yield* FileSystem.FileSystem;
          const missing = new Map<string, string>(catalogNegativeFiles.missing);
          const undescribed = new Map<string, string>(catalogNegativeFiles.undescribed);

          for (const name of catalogNegativeNames) {
            const dir = yield* materialize(name);
            const files = yield* filesOf(dir);
            const manifest = yield* fs.readFileString(`${dir}/imsmanifest.xml`);
            const listed = listedFilesOf(manifest);
            const packaged = files.filter((file) => file !== "imsmanifest.xml");
            let size = 0;

            for (const file of files) {
              size += Number((yield* fs.stat(`${dir}/${file}`)).size);

              if (file.endsWith(".xml") && file !== "imsmanifest.xml") {
                const document = yield* readXml(yield* fs.readFile(`${dir}/${file}`));

                if (!file.startsWith("links/")) {
                  assert.strictEqual(document.root.namespace, qtiNamespace, `${name}/${file}`);
                }
              }
            }

            assert.isBelow(size, 2 * 1024 * 1024, name);
            assert.deepStrictEqual(
              packaged,
              [
                ...listed.filter((file) => file !== missing.get(name)),
                ...(undescribed.has(name) ? [undescribed.get(name) ?? ""] : []),
              ].toSorted(),
              name,
            );

            const absent = missing.get(name);
            const unlisted = undescribed.get(name);

            if (absent !== undefined) {
              assert.include(listed, absent, name);
              assert.notInclude(packaged, absent, name);
            }

            if (unlisted !== undefined) {
              assert.notInclude(listed, unlisted, name);
              assert.include(packaged, unlisted, name);
            }
          }

          for (const [name, file, needle] of catalogNegativePresent) {
            const dir = yield* materialize(name);

            assert.include(yield* fs.readFileString(`${dir}/${file}`), needle, `${name}: ${file}`);
          }
        }),
      ),
    testTimeoutMs,
  );

  it.effect("the empty card and the empty entry are cut-catalog-supports with one card more", () =>
    inFreshRoot(() =>
      Effect.gen(function* emptyCards() {
        const fs = yield* FileSystem.FileSystem;
        const item = "items/CatalogWithMultipleSupports.xml";
        const base = yield* fs.readFileString(
          `${yield* materialize("cut-catalog-supports")}/${item}`,
        );
        const card = yield* fs.readFileString(`${yield* materialize("card-empty")}/${item}`);
        const entry = yield* fs.readFileString(`${yield* materialize("entry-empty")}/${item}`);

        assert.strictEqual(base.split("<qti-card ").length - 1, 2);
        assert.strictEqual(
          card,
          base.replace("</qti-catalog>", '<qti-card support="spoken"/></qti-catalog>'),
        );
        assert.strictEqual(
          entry,
          base.replace(
            "</qti-catalog>",
            '<qti-card support="spoken"><qti-card-entry xml:lang="en"/></qti-card></qti-catalog>',
          ),
        );
      }),
    ),
  );

  it.effect("the catalog positives put their catalogs in every host and name each one", () =>
    inFreshRoot(() =>
      Effect.gen(function* catalogHosts() {
        const fs = yield* FileSystem.FileSystem;
        const hosts = yield* fs.readFileString(
          `${yield* materialize("catalog-hosts")}/items/BG007.xml`,
        );
        const rubric = yield* fs.readFileString(
          `${yield* materialize("cut-catalog-rubric")}/items/rubric_block.xml`,
        );
        const files = yield* fs.readFileString(`${yield* materialize("card-files")}/choice.xml`);

        for (const id of [
          "cat-feedback",
          "cat-template",
          "cat-template-feedback",
          "cat-rubric-template",
          "cat-modal",
        ]) {
          assert.strictEqual(hosts.split(`<qti-catalog id="${id}">`).length, 2, id);
          assert.strictEqual(hosts.split(`data-catalog-idref="${id}"`).length, 2, id);
        }

        assert.strictEqual(hosts.split("<qti-catalog-info>").length - 1, 5);
        assert.include(rubric, "asl/ss_choice_directions.m4v");
        assert.strictEqual(files.split("<qti-file-href ").length - 1, 4);
      }),
    ),
  );

  it.effect(
    "card-files names only files its package holds, and catalog-padded the one it has",
    () =>
      inFreshRoot(() =>
        Effect.gen(function* cardFiles() {
          const fs = yield* FileSystem.FileSystem;

          for (const name of ["card-files", "catalog-padded"] as const) {
            const dir = yield* materialize(name);
            const text = yield* fs.readFileString(`${dir}/choice.xml`);

            for (const match of text.matchAll(
              /<qti-file-href [^>]*>(?<href>[^<]*)<\/qti-file-href>/gu,
            )) {
              assert.isTrue(
                yield* fs.exists(`${dir}/${(match.groups?.["href"] ?? "").trim()}`),
                name,
              );
            }
          }
        }),
      ),
  );

  it.effect("the PCI names are the brief's list, each in the fixture table and no negative", () =>
    Effect.sync(() => {
      assert.deepStrictEqual(
        [...pciNames],
        [
          "pci-simple",
          "pci-modules",
          "pci-configurations",
          "pci-variables",
          "pci-3-0-1",
          "pci-context-3-0-1",
          "pci-catalog-3-0-1",
          "pci-markup-content",
          "template-foreign",
          "custom-3-0-1",
        ],
      );
      assert.strictEqual(new Set(pciNames).size, 10);
      assert.deepStrictEqual(
        pciVersions.map(([name]) => name),
        [...pciNames],
      );
      assert.deepStrictEqual(
        pciPackages.map(([name]) => name),
        [...pciNames],
      );
      assert.includeMembers([...fixtureNames], [...pciNames]);

      for (const name of pciNames) {
        assert.notInclude(
          [
            ...negativeNames,
            ...restoredNames,
            ...assemblyNames,
            ...catalogNames,
            ...companionNames,
            ...catalogNegativeNames,
          ],
          name,
        );
      }
    }),
  );

  it.effect(
    "each PCI positive materializes under 2 MB, holds the files its row lists, lists every one, carries its edit and no custom data attribute",
    () =>
      inFreshRoot(() =>
        Effect.gen(function* pciFixtures() {
          const fs = yield* FileSystem.FileSystem;

          for (const [name, version] of pciVersions) {
            const dir = yield* materialize(name);
            const entries = yield* fs.readDirectory(dir, { recursive: true });
            const files: string[] = [];
            let size = 0;

            for (const entry of entries) {
              const info = yield* fs.stat(`${dir}/${entry}`);

              if (info.type === "File") {
                files.push(entry);
                size += Number(info.size);
              }
            }

            const manifest = yield* fs.readFileString(`${dir}/imsmanifest.xml`);
            const held = files.filter((file) => file !== "imsmanifest.xml").toSorted();

            assert.include(manifest, `<schemaversion>${version}</schemaversion>`, name);
            assert.deepStrictEqual(held, listedFilesOf(manifest), name);
            assert.deepStrictEqual(held, pciPackages.find(([row]) => row === name)?.[2], name);
            assert.isBelow(size, 2 * 1024 * 1024, name);

            const item = pciPackages.find(([row]) => row === name)?.[1] ?? "";
            const text = yield* fs.readFileString(`${dir}/${item}`);
            const document = yield* readXml(yield* fs.readFile(`${dir}/${item}`));

            assert.strictEqual(document.root.namespace, qtiNamespace, name);
            assert.notMatch(text, /\sdata-(?!catalog-idref)/u, name);

            for (const [row, needle] of pciPresent) {
              if (row === name) {
                assert.include(text, needle, `${name}: ${needle}`);
              }
            }
          }
        }),
      ),
    testTimeoutMs,
  );

  it.effect(
    "pci-modules holds two PCIs of the same four modules, whitespace-only markup, the listed handlebars file and no raphael",
    () =>
      inFreshRoot(() =>
        Effect.gen(function* pciModules() {
          const fs = yield* FileSystem.FileSystem;
          const dir = yield* materialize("pci-modules");
          const text = yield* fs.readFileString(`${dir}/fractions_deps.xml`);
          const manifest = yield* fs.readFileString(`${dir}/imsmanifest.xml`);

          assert.strictEqual(occurrences(text, "<qti-portable-custom-interaction "), 2);
          assert.strictEqual(occurrences(text, "<qti-interaction-modules>"), 2);
          assert.strictEqual(occurrences(text, "<qti-interaction-module "), 8);

          for (const id of ["jquery", "eve", "raphael", "shadingD"]) {
            assert.strictEqual(occurrences(text, `<qti-interaction-module id="${id}" `), 2, id);
          }

          assert.match(
            text,
            /<qti-interaction-markup>\s*<\/qti-interaction-markup>[\s\S]*<qti-interaction-markup>\s*<\/qti-interaction-markup>/u,
          );
          assert.include(manifest, '<file href="modules/lib/handlebars.min-latest.js"/>');
          assert.notInclude(manifest, "raphael");
          assert.isFalse(yield* fs.exists(`${dir}/modules/lib/raphael.js`));
        }),
      ),
  );

  it.effect(
    "pci-configurations names two configuration files its package holds and lists, one PCI with both module forms and three shapes of module",
    () =>
      inFreshRoot(() =>
        Effect.gen(function* pciConfigurations() {
          const fs = yield* FileSystem.FileSystem;
          const dir = yield* materialize("pci-configurations");
          const text = yield* fs.readFileString(`${dir}/fractions_deps_2.xml`);
          const manifest = yield* fs.readFileString(`${dir}/imsmanifest.xml`);

          assert.notInclude(text, "fallback-configuration");

          for (const file of ["modules/hmh_co_com.js", "modules/hmh_co_com_fallback.json"]) {
            assert.isTrue(yield* fs.exists(`${dir}/${file}`), file);
            assert.include(manifest, `<file href="${file}"/>`, file);
          }

          assert.strictEqual(occurrences(text, "<qti-portable-custom-interaction "), 2);
          assert.include(text, '        module="shadingD"\n        response-identifier="EXAMPLE">');
          assert.include(text, '<qti-interaction-module id="eve"/>');
          assert.include(
            text,
            '<qti-interaction-module id="raphael" fallback-path="modules/lib/raphael.js"/>',
          );
          assert.include(
            text,
            '<qti-interaction-module id="shadingD" primary-path="modules/shading_depsXX.js" fallback-path="modules/shading_deps.js"/>',
          );
        }),
      ),
  );

  it.effect(
    "the PCI positives self-close every template and custom interaction but template-foreign's",
    () =>
      inFreshRoot(() =>
        Effect.gen(function* pciSelfClosed() {
          const fs = yield* FileSystem.FileSystem;

          for (const name of pciNames) {
            const dir = yield* materialize(name);
            const item = pciPackages.find(([row]) => row === name)?.[1] ?? "";
            const text = yield* fs.readFileString(`${dir}/${item}`);
            const opened = occurrences(text, "<template") - occurrences(text, "<template-");

            if (name === "template-foreign") {
              assert.strictEqual(opened, 1);
              assert.include(text, "</template>");
            } else {
              assert.notInclude(text, "</template>", name);
              assert.notInclude(text, "</qti-custom-interaction>", name);
              assert.strictEqual(opened, occurrences(text, "<template/>"), name);
            }
          }
        }),
      ),
  );

  it.effect(
    "the PCI negative names are the spec's 28, with a verdict row each, apart from every other list and from phase 5's 60",
    () =>
      Effect.sync(() => {
        assert.strictEqual(pciNegativeNames.length, 28);
        assert.strictEqual(new Set(pciNegativeNames).size, 28);
        assert.strictEqual(negativeNames.length, 60);
        assert.deepStrictEqual(
          pciVerdicts.map(([name]) => name),
          [...pciNegativeNames],
        );
        assert.deepStrictEqual(
          pciNegativeRows.map(([name]) => name),
          [...pciNegativeNames],
        );
        assert.includeMembers([...fixtureNames], [...pciNegativeNames]);

        for (const [name, rules] of pciVerdicts) {
          assert.isAbove(rules.length, 0, name);
          assert.strictEqual(new Set(rules).size, rules.length, name);
        }

        for (const name of pciNegativeNames) {
          assert.notInclude(
            [
              ...negativeNames,
              ...restoredNames,
              ...assemblyNames,
              ...catalogNames,
              ...companionNames,
              ...catalogNegativeNames,
              ...pciNames,
            ],
            name,
          );
        }
      }),
  );

  it.effect(
    "each PCI negative materializes under 2 MB at its version, holds the files its row lists, carries its edit and no custom data attribute",
    () =>
      inFreshRoot(() =>
        Effect.gen(function* pciNegatives() {
          const fs = yield* FileSystem.FileSystem;

          for (const [name, item, version, needle] of pciNegativeRows) {
            const dir = yield* materialize(name);
            const files = yield* filesOf(dir);
            const manifest = yield* fs.readFileString(`${dir}/imsmanifest.xml`);
            let size = 0;

            for (const file of files) {
              size += Number((yield* fs.stat(`${dir}/${file}`)).size);
            }

            assert.include(manifest, `<schemaversion>${version}</schemaversion>`, name);
            assert.deepStrictEqual(
              files.filter((file) => file !== "imsmanifest.xml"),
              [...(pciNegativeFiles[name]?.held ?? pciNegativeStandard)],
              name,
            );
            assert.deepStrictEqual(
              listedFilesOf(manifest),
              [
                ...(pciNegativeFiles[name]?.listed ??
                  pciNegativeFiles[name]?.held ??
                  pciNegativeStandard),
              ],
              name,
            );
            assert.isBelow(size, 2 * 1024 * 1024, name);

            const text = yield* fs.readFileString(`${dir}/${item}`);
            const document = yield* readXml(yield* fs.readFile(`${dir}/${item}`));

            assert.strictEqual(document.root.namespace, qtiNamespace, name);
            assert.notMatch(text, /\sdata-(?!catalog-idref)/u, name);
            assert.include(text, needle, `${name}: ${needle}`);
          }
        }),
      ),
    testTimeoutMs,
  );

  it.effect(
    "the PCI negatives that start from a positive differ from it in the one edit their row names",
    () =>
      inFreshRoot(() =>
        Effect.gen(function* pciNegativeAgainstPositive() {
          const fs = yield* FileSystem.FileSystem;
          const textOf = Effect.fn("textOf")(function* textOf(name: FixtureName, item: string) {
            return yield* fs.readFileString(`${yield* materialize(name)}/${item}`);
          });
          const positive = yield* textOf("pci-configurations", "fractions_deps_2.xml");
          const fallback = yield* textOf("pci-items-fallback", "fractions_deps_2.xml");
          const missing = yield* textOf("pci-configuration-missing", "fractions_deps_2.xml");
          const modules = yield* textOf("pci-modules", "fractions_deps.xml");

          assert.strictEqual(
            fallback,
            positive.replace('secondary-configuration="', 'fallback-configuration="'),
          );
          assert.strictEqual(
            missing,
            positive.replace(
              'primary-configuration="modules/hmh_co_com.js"',
              'primary-configuration="modules/hmh_co_comXX.js"',
            ),
          );
          assert.strictEqual(yield* textOf("pci-items-unlisted", "fractions_deps.xml"), modules);
          assert.strictEqual(yield* textOf("pci-items-missing", "fractions_deps.xml"), modules);
        }),
      ),
    testTimeoutMs,
  );
});

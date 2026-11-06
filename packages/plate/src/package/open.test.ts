import { readdir } from "node:fs/promises";
import path from "node:path";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { corpusRoot, readCorpusFile } from "#plate/document/corpus.ts";
import { readSource } from "#plate/document/read.ts";
import { readManifest } from "#plate/package/manifest.ts";
import { acceptPackageForTest, itemRefs, openPackage } from "#plate/package/open.ts";
import type {
  AcceptedPackage,
  PackageResource,
  PackageTest,
  PackageVerdict,
} from "#plate/package/open.ts";
import { fileLocation, manifestFile } from "#plate/package/store.ts";
import type { Location, Refusal } from "#plate/validate/refusal.ts";
import { manifestNamespace } from "#plate/vocabulary.ts";

/**
 * The location every hand-built package in these tests carries.
 */
const location = "package.zip";

/**
 * QTI 3.0's namespace, which every hand-built QTI document's root is in.
 */
const qti = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

/**
 * The path step of an element in the manifest's namespace, as a resource's location spells it.
 */
const cp = `{${manifestNamespace}}`;

/**
 * The corpus packages these tests read, each the directory its zip was extracted into.
 */
const corpusPackages = {
  begGuide: "QTI3_BeginnersGuide_Examples/BegGuide_March2025.zip.d",
  bpig: "QTI3_BPIG_Examples/BPIG_22April.zip.d",
  caseWithOutcome: "qtiv3-examples/packaging/CASEWithOutcome/CASEWithOutcome.zip.d",
  metaData: "qtiv3-examples/packaging/metaData/metaData.zip.d",
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
 * Take the facts of every refusal of a package verdict, none when it is not refused.
 *
 * @param verdict The package verdict.
 * @returns The refusals' facts, in order.
 */
const refusalsOf = (verdict: PackageVerdict): Seen[] =>
  verdict.verdict === "refused" ? verdict.refusals.map((refusal) => seen(refusal)) : [];

/**
 * Take the accepted package of an accepting verdict; the test fails when it does not accept.
 *
 * @param verdict The package verdict.
 * @returns The accepted package.
 */
const acceptedOf = (verdict: PackageVerdict): AcceptedPackage => {
  assert.deepStrictEqual(refusalsOf(verdict), [], "the package is not refused");
  if (verdict.verdict !== "accepted" && verdict.verdict !== "accepted-with-unsupported") {
    return assert.fail(`the package is ${verdict.verdict}, not accepted`);
  }

  return verdict.accepted;
};

/**
 * Find a resource of a package verdict by identifier; the test fails when there is none.
 *
 * @param verdict The package verdict.
 * @param identifier The resource's identifier.
 * @returns The resource.
 */
const resourceOf = (verdict: PackageVerdict, identifier: string): PackageResource => {
  const found = verdict.resources.find((entry) => entry.identifier === identifier);
  if (found === undefined) {
    return assert.fail(`the package lists the resource ${identifier}`);
  }

  return found;
};

/**
 * Give the kind of the verdict on a resource's document.
 *
 * @param resource The resource.
 * @returns The verdict's kind, none when the resource has no verdict.
 */
const documentKind = (resource: PackageResource): Option.Option<string> =>
  resource.verdict.pipe(Option.map((document) => document.kind));

/**
 * Give the verdict on a resource's document, as its `verdict` names it.
 *
 * @param resource The resource.
 * @returns The verdict's name, none when the resource has no verdict.
 */
const documentVerdict = (resource: PackageResource): Option.Option<string> =>
  resource.verdict.pipe(Option.map((document) => document.verdict));

/**
 * The resource types whose document a host never serves: the eight QTI types of the profile's
 * `type` enumeration (ruling R3, widened to every QTI resource).
 */
const qtiDocumentTypes: ReadonlySet<string> = new Set([
  "imsqti_fragment_xmlv3p0",
  "imsqti_item_xmlv3p0",
  "imsqti_outcomes_xmlv3p0",
  "imsqti_resprocessing_xmlv3p0",
  "imsqti_rptemplate_xmlv3p0",
  "imsqti_section_xmlv3p0",
  "imsqti_stimulus_xmlv3p0",
  "imsqti_test_xmlv3p0",
]);

/**
 * Give the paths of the documents a package verdict's QTI resources name, read from each
 * resource's declared type.
 *
 * @param verdict The package verdict.
 * @returns The path of each QTI resource's document.
 */
const qtiDocumentsOf = (verdict: PackageVerdict): ReadonlySet<string> =>
  new Set(
    verdict.resources.flatMap((resource) =>
      qtiDocumentTypes.has(resource.type) ? Option.toArray(resource.path) : [],
    ),
  );

/**
 * Hold a hand-built package's files as bytes, keyed by path.
 *
 * @param files Each file's text, keyed by its path.
 * @returns The files.
 */
const packageOf = (files: Readonly<Record<string, string>>): ReadonlyMap<string, Uint8Array> =>
  new Map(
    Object.entries(files).map(([key, text]) => [key, new TextEncoder().encode(text)] as const),
  );

/**
 * Write a 3.0.0 manifest whose `resources` holds the given resources.
 *
 * @param resources The content of `resources`.
 * @returns The manifest's text.
 */
const manifestXml = (...resources: readonly string[]): string =>
  `<manifest xmlns="${manifestNamespace}" identifier="M"><metadata><schema>QTI Package</schema><schemaversion>3.0.0</schemaversion></metadata><organizations/><resources>${resources.join("")}</resources></manifest>`;

/**
 * Write one resource whose `href` names its one file.
 *
 * @param identifier The resource's identifier.
 * @param type Its declared type.
 * @param href Its document's path.
 * @returns The resource's text.
 */
const resourceXml = (identifier: string, type: string, href: string): string =>
  `<resource identifier="${identifier}" type="${type}" href="${href}"><file href="${href}"/></resource>`;

/**
 * The path of a hand-built manifest's one resource, as a refusal at it is located.
 */
const soleResource = `${cp}manifest/${cp}resources/${cp}resource`;

/**
 * LOM's namespace, which a resource's own metadata describes it in.
 */
const lomNamespace = "http://ltsc.ieee.org/xsd/LOM";

/**
 * The path step of an element in LOM's namespace, as a location spells it.
 */
const lomStep = `{${lomNamespace}}`;

/**
 * Write one resource whose own metadata holds one LOM record, and whose `href` names its one file.
 *
 * @param identifier The resource's identifier.
 * @param type Its declared type.
 * @param href Its document's path.
 * @param general What the LOM record's `general` holds.
 * @returns The resource's text.
 */
const describedXml = (identifier: string, type: string, href: string, general: string): string =>
  `<resource identifier="${identifier}" type="${type}" href="${href}"><metadata><lom xmlns="${lomNamespace}"><general>${general}</general></lom></metadata><file href="${href}"/></resource>`;

/**
 * Write a LOM `general`'s identifiers, one `identifier` for each entry.
 *
 * @param entries Each identifier's entry.
 * @returns The identifiers' text.
 */
const lomIdentifiers = (...entries: readonly string[]): string =>
  entries.map((entry) => `<identifier><entry>${entry}</entry></identifier>`).join("");

/**
 * Write a LOM `general`'s title, one `string` for each value.
 *
 * @param strings The title's strings.
 * @returns The title's text.
 */
const lomTitle = (...strings: readonly string[]): string =>
  `<title>${strings.map((value) => `<string>${value}</string>`).join("")}</title>`;

/**
 * The path of a hand-built manifest's resource at a position among several.
 *
 * @param position The resource's 1-based position.
 * @returns Its path.
 */
const resourceAt = (position: number): string =>
  `${cp}manifest/${cp}resources/${cp}resource[${position}]`;

/**
 * The path of the LOM `general` in the own metadata of a resource at a path.
 *
 * @param resource The resource's path.
 * @returns The `general`'s path.
 */
const generalAt = (resource: string): string =>
  `${resource}/${cp}metadata/${lomStep}lom/${lomStep}general`;

/**
 * Write an item that declares the given outcome variables, each a single float.
 *
 * @param identifier The item's identifier.
 * @param outcomes The outcome variables' identifiers.
 * @returns The item's text.
 */
const itemXml = (identifier: string, ...outcomes: readonly string[]): string =>
  `<qti-assessment-item xmlns="${qti}" identifier="${identifier}" title="${identifier}" adaptive="false" time-dependent="false">${outcomes.map((outcome) => `<qti-outcome-declaration identifier="${outcome}" cardinality="single" base-type="float"/>`).join("")}<qti-item-body><p>${identifier}</p></qti-item-body></qti-assessment-item>`;

/**
 * Write a test of one part and one section holding the given item refs, whose outcome processing
 * sets its float outcome `TOTAL` to the variable a reference names.
 *
 * @param reference The reference the outcome processing reads.
 * @param refs Each item ref's identifier and `href`.
 * @returns The test's text.
 */
const testXml = (
  reference: string,
  ...refs: readonly (readonly [identifier: string, href: string])[]
): string =>
  `<qti-assessment-test xmlns="${qti}" identifier="T" title="T"><qti-outcome-declaration identifier="TOTAL" cardinality="single" base-type="float"/><qti-test-part identifier="P" navigation-mode="linear" submission-mode="individual"><qti-assessment-section identifier="S" title="S" visible="true">${refs.map(([identifier, href]) => `<qti-assessment-item-ref identifier="${identifier}" href="${href}"/>`).join("")}</qti-assessment-section></qti-test-part><qti-outcome-processing><qti-set-outcome-value identifier="TOTAL"><qti-variable identifier="${reference}"/></qti-set-outcome-value></qti-outcome-processing></qti-assessment-test>`;

/**
 * A package whose test's item refs are `a` and `a.b` and whose outcome processing reads
 * `a.b.SCORE`: item `a.b` declares `SCORE`, and item `a` declares the given variables.
 *
 * @param declaredInA The outcome variables item `a` declares.
 * @returns The package's files.
 */
const dottedPackage = (...declaredInA: readonly string[]): ReadonlyMap<string, Uint8Array> =>
  packageOf({
    [manifestFile]: manifestXml(
      resourceXml("T", "imsqti_test_xmlv3p0", "test.xml"),
      resourceXml("A", "imsqti_item_xmlv3p0", "items/a.xml"),
      resourceXml("AB", "imsqti_item_xmlv3p0", "items/ab.xml"),
    ),
    "items/a.xml": itemXml("a", ...declaredInA),
    "items/ab.xml": itemXml("ab", "SCORE"),
    "test.xml": testXml("a.b.SCORE", ["a", "items/a.xml"], ["a.b", "items/ab.xml"]),
  });

/**
 * A package whose test's item refs are `a` and `a.2` and whose section is `a.S`, and whose outcome
 * processing reads a given reference: item `a` declares `SCORE` and `S.duration`, and item `a.2`
 * declares `SCORE`.
 *
 * @param reference The reference the test's outcome processing reads.
 * @returns The package's files.
 */
const formsPackage = (reference: string): ReadonlyMap<string, Uint8Array> =>
  packageOf({
    [manifestFile]: manifestXml(
      resourceXml("T", "imsqti_test_xmlv3p0", "test.xml"),
      resourceXml("A", "imsqti_item_xmlv3p0", "items/a.xml"),
      resourceXml("A2", "imsqti_item_xmlv3p0", "items/a2.xml"),
    ),
    "items/a.xml": itemXml("a", "SCORE", "S.duration"),
    "items/a2.xml": itemXml("a2", "SCORE"),
    "test.xml": testXml(reference, ["a", "items/a.xml"], ["a.2", "items/a2.xml"]).replace(
      'identifier="S"',
      'identifier="a.S"',
    ),
  });

/**
 * Take the two readings each `ambiguous-reference` refusal of a package verdict names, in order.
 *
 * @param verdict The package verdict.
 * @returns Each refusal's first prefix and variable, then its second.
 */
const readings = (verdict: PackageVerdict): (string | undefined)[][] =>
  refusalsOf(verdict)
    .filter((refusal) => refusal.rule === "ambiguous-reference")
    .map((refusal) => [
      refusal.detail["firstPrefix"],
      refusal.detail["firstVariable"],
      refusal.detail["secondPrefix"],
      refusal.detail["secondVariable"],
    ]);

/**
 * Take an accepted package's test at a path; the test fails when there is none.
 *
 * @param accepted The accepted package.
 * @param testPath The test's path.
 * @returns The test with its items.
 */
const testOf = (accepted: AcceptedPackage, testPath: string): PackageTest => {
  const found = accepted.tests.get(testPath);
  if (found === undefined) {
    return assert.fail(`the package holds the accepted test ${testPath}`);
  }

  return found;
};

/**
 * Read every file of an extracted corpus package, keyed by its path from the package's root.
 *
 * @param directory The package's directory under the corpus root.
 * @returns The package's files.
 */
const corpusPackage = (directory: string) =>
  Effect.gen(function* readCorpusPackage() {
    const root = path.join(yield* corpusRoot, directory);
    const entries = yield* Effect.tryPromise(() =>
      readdir(root, { recursive: true, withFileTypes: true }),
    );
    const paths = entries
      .filter((entry) => entry.isFile())
      .map((entry) =>
        path.relative(root, path.join(entry.parentPath, entry.name)).split(path.sep).join("/"),
      );
    const contents = yield* Effect.all(paths.map((file) => readCorpusFile(`${directory}/${file}`)));

    return new Map(paths.map((file, index) => [file, contents[index] ?? new Uint8Array()]));
  });

/**
 * Open an extracted corpus package from the cache.
 *
 * @param directory The package's directory under the corpus root, also its location.
 * @returns Its verdict.
 */
const openCorpusPackage = (directory: string) =>
  Effect.flatMap(corpusPackage(directory), (files) => openPackage(directory, files));

/**
 * Take the rule, document and detail of every refusal of a package verdict, none when it is not
 * refused, for a refusal whose location these tests do not compare.
 *
 * @param verdict The package verdict.
 * @returns The refusals' facts, in order.
 */
const unlocated = (verdict: PackageVerdict): Omit<Seen, "location">[] =>
  refusalsOf(verdict).map(({ detail, document, rule }) => ({ detail, document, rule }));

describe("package/open.ts", () => {
  describe("openPackage", () => {
    it.effect(
      "[P-1] [P-4] BegGuide_March2025 is accepted, its BGtest.xml resolving six items",
      () =>
        Effect.gen(function* begGuide() {
          const directory = corpusPackages.begGuide;
          const verdict = yield* openPackage(directory, yield* corpusPackage(directory));
          const accepted = acceptedOf(verdict);
          const bgTest = testOf(accepted, fileLocation(directory, "BGtest.xml"));

          const refs = itemRefs(bgTest.test);

          assert.deepStrictEqual(
            refs.map((entry) => entry.identifier),
            [
              "firstexample",
              "beginnersguide007",
              "beginnersguide008",
              "beginnersguide009",
              "beginnersguide010",
              "beginnersguide011",
            ],
          );
          assert.deepStrictEqual(refs[1], {
            href: "items/BG007.xml",
            identifier: "beginnersguide007",
          });
          assert.deepStrictEqual(
            [...bgTest.items.keys()],
            refs.map((entry) => entry.identifier),
          );
          assert.deepStrictEqual(
            [...bgTest.items.values()].map((item) => item.document),
            refs.map((entry) => fileLocation(directory, entry.href)),
          );
          assert.strictEqual(accepted.version, "3.0.1");
          assert.strictEqual(accepted.location, directory);
          assert.lengthOf(accepted.items, 6);
          assert.lengthOf(accepted.stimuli, 0);
          assert.deepStrictEqual(
            [...accepted.files].toSorted(),
            [...(yield* corpusPackage(directory)).keys()]
              .filter((file) => file !== manifestFile && !qtiDocumentsOf(verdict).has(file))
              .toSorted(),
          );
          assert.includeMembers([...qtiDocumentsOf(verdict)], ["BGtest.xml", "items/BG007.xml"]);
          assert.isTrue(accepted.files.has("items/resources/crows.jpg"));
          assert.deepStrictEqual(documentKind(resourceOf(verdict, "BGtest")), Option.some("test"));
          assert.isTrue(Option.isNone(resourceOf(verdict, "image_resource_1").verdict));
        }),
    );

    it.effect(
      "[P-1] [P-4] BPIG_22April is refused resource-type-mismatch at passages/unbelievableNight.xml, though its MathML item, math, is unchecked",
      () =>
        Effect.gen(function* bpig() {
          const directory = corpusPackages.bpig;
          const verdict = yield* openPackage(directory, yield* corpusPackage(directory));
          const manifest = yield* readCorpusFile(`${directory}/${manifestFile}`).pipe(
            Effect.flatMap((bytes) => readSource(fileLocation(directory, manifestFile), bytes)),
            Effect.map((source) => Result.getOrThrow(readManifest(source))),
          );
          const stimulus = manifest.resources.find((entry) => entry.identifier === "Stimulus1");

          assert.strictEqual(verdict.verdict, "refused");
          assert.deepInclude(refusalsOf(verdict), {
            detail: {
              expected: "imsqti_stimulus_xmlv3p0",
              path: "passages/unbelievableNight.xml",
              root: "qti-assessment-stimulus",
              type: "imsqti_test_xmlv3p0",
            },
            document: fileLocation(directory, manifestFile),
            location: { kind: "path", path: stimulus?.location ?? "" },
            rule: "resource-type-mismatch",
          });
          assert.deepStrictEqual(
            documentKind(resourceOf(verdict, "Stimulus1")),
            Option.some("stimulus"),
          );
          assert.deepStrictEqual(
            documentVerdict(resourceOf(verdict, "math")),
            Option.some("unchecked"),
          );
        }),
    );

    it.effect(
      "refuses a hand-built item declared imsqti_test_xmlv3p0 as resource-type-mismatch",
      () =>
        Effect.gen(function* itemAsTest() {
          const verdict = yield* openPackage(
            location,
            packageOf({
              [manifestFile]: manifestXml(resourceXml("A", "imsqti_test_xmlv3p0", "items/a.xml")),
              "items/a.xml": itemXml("a", "SCORE"),
            }),
          );

          assert.deepStrictEqual(refusalsOf(verdict), [
            {
              detail: {
                expected: "imsqti_item_xmlv3p0",
                path: "items/a.xml",
                root: "qti-assessment-item",
                type: "imsqti_test_xmlv3p0",
              },
              document: fileLocation(location, manifestFile),
              location: { kind: "path", path: soleResource },
              rule: "resource-type-mismatch",
            },
          ]);
          assert.deepStrictEqual(
            documentVerdict(resourceOf(verdict, "A")),
            Option.some("accepted"),
          );
        }),
    );

    it.effect("refuses a package holding one refused item, with that refusal beneath it", () =>
      Effect.gen(function* refusedItem() {
        const verdict = yield* openPackage(
          location,
          packageOf({
            [manifestFile]: manifestXml(
              resourceXml("A", "imsqti_item_xmlv3p0", "items/a.xml"),
              resourceXml("B", "imsqti_item_xmlv3p0", "items/b.xml"),
            ),
            "items/a.xml": itemXml("a", "SCORE"),
            "items/b.xml": `<qti-assessment-item xmlns="${qti}" identifier="b" adaptive="false" time-dependent="false"><qti-item-body><p>b</p></qti-item-body></qti-assessment-item>`,
          }),
        );
        const beneath = Option.getOrThrow(resourceOf(verdict, "B").verdict);
        const refusal: Seen = {
          detail: { attribute: "title", element: "qti-assessment-item" },
          document: fileLocation(location, "items/b.xml"),
          location: { kind: "path", path: "qti-assessment-item" },
          rule: "missing-attribute",
        };

        assert.strictEqual(verdict.verdict, "refused");
        assert.deepStrictEqual(refusalsOf(verdict), [refusal]);
        assert.deepStrictEqual(
          beneath.verdict === "refused" ? beneath.refusals.map((entry) => seen(entry)) : [],
          [refusal],
        );
        assert.deepStrictEqual(documentVerdict(resourceOf(verdict, "A")), Option.some("accepted"));
      }),
    );

    it.effect(
      "refuses a.b.SCORE as ambiguous-reference when item refs a and a.b both resolve it (reading 48)",
      () =>
        Effect.gen(function* ambiguous() {
          const verdict = yield* openPackage(location, dottedPackage("b.SCORE"));

          assert.deepStrictEqual(refusalsOf(verdict), [
            {
              detail: {
                firstPrefix: "a",
                firstVariable: "b.SCORE",
                reading: "48",
                reference: "a.b.SCORE",
                secondPrefix: "a.b",
                secondVariable: "SCORE",
              },
              document: fileLocation(location, "test.xml"),
              location: {
                kind: "path",
                path: "qti-assessment-test/qti-outcome-processing/qti-set-outcome-value/qti-variable/@identifier",
              },
              rule: "ambiguous-reference",
            },
          ]);
        }),
    );

    it.effect("accepts a.b.SCORE when only item ref a.b resolves it (reading 48)", () =>
      Effect.gen(function* unambiguous() {
        const accepted = acceptedOf(yield* openPackage(location, dottedPackage("SCORE")));

        assert.deepStrictEqual(
          [...testOf(accepted, fileLocation(location, "test.xml")).items].map(
            ([identifier, item]) => [identifier, item.document],
          ),
          [
            ["a", fileLocation(location, "items/a.xml")],
            ["a.b", fileLocation(location, "items/ab.xml")],
          ],
          "each item ref is resolved",
        );
      }),
    );

    it.effect(
      "counts the occurrence form, the built-ins and a section's duration among a reference's readings (reading 48)",
      () =>
        Effect.gen(function* forms() {
          assert.deepStrictEqual(
            readings(yield* openPackage(location, formsPackage("a.2.SCORE"))),
            [["a", "2.SCORE", "a.2", "SCORE"]],
          );
          assert.deepStrictEqual(
            readings(yield* openPackage(location, formsPackage("a.2.duration"))),
            [["a", "2.duration", "a.2", "duration"]],
          );
          assert.deepStrictEqual(
            readings(yield* openPackage(location, formsPackage("a.S.duration"))),
            [["a", "S.duration", "a.S", "duration"]],
          );
          assert.deepStrictEqual(
            readings(yield* openPackage(location, formsPackage("a.b.SCORE"))),
            [],
          );
        }),
    );

    it.effect(
      "resolves an item ref as startTest does: against the test's path, escapes decoded before dot segments are removed, query and fragment set aside",
      () =>
        Effect.gen(function* escaped() {
          const accepted = acceptedOf(
            yield* openPackage(
              location,
              packageOf({
                [manifestFile]: manifestXml(
                  resourceXml("T", "imsqti_test_xmlv3p0", "tests/test.xml"),
                  resourceXml("A", "imsqti_item_xmlv3p0", "items/a%20b.xml"),
                ),
                "items/a b.xml": itemXml("a", "SCORE"),
                "tests/test.xml": testXml(
                  "a.SCORE",
                  ["a", "../items/a%20b.xml"],
                  ["b", "./../items/./a b.xml?x=1#y"],
                  ["c", "%2E%2E/items/a%20b.xml"],
                ),
              }),
            ),
          );
          const { items } = testOf(accepted, fileLocation(location, "tests/test.xml"));

          assert.deepStrictEqual([...items.keys()], ["a", "b", "c"]);
          assert.deepStrictEqual(
            [...items.values()].map((item) => item.document),
            [
              fileLocation(location, "items/a b.xml"),
              fileLocation(location, "items/a b.xml"),
              fileLocation(location, "items/a b.xml"),
            ],
          );
          assert.deepStrictEqual([...accepted.files], []);
        }),
    );

    it.effect("refuses an item ref whose href resolves to no listed item resource", () =>
      Effect.gen(function* unresolved() {
        const verdict = yield* openPackage(
          location,
          packageOf({
            [manifestFile]: manifestXml(
              resourceXml("T", "imsqti_test_xmlv3p0", "tests/test.xml"),
              resourceXml("A", "imsqti_item_xmlv3p0", "items/a.xml"),
            ),
            "items/a.xml": itemXml("a", "SCORE"),
            "tests/test.xml": testXml(
              "a.SCORE",
              ["a", "../items/a.xml"],
              ["b", "items/b.xml"],
              ["c", "https://example.org/c.xml"],
            ),
          }),
        );
        const unresolvedRef = (index: number, detail: Readonly<Record<string, string>>): Seen => ({
          detail,
          document: fileLocation(location, "tests/test.xml"),
          location: {
            kind: "path",
            path: `qti-assessment-test/qti-test-part/qti-assessment-section/qti-assessment-item-ref[${index}]`,
          },
          rule: "item-ref-unresolved",
        });

        assert.deepStrictEqual(refusalsOf(verdict), [
          unresolvedRef(2, { href: "items/b.xml", identifier: "b", path: "tests/items/b.xml" }),
          unresolvedRef(3, { href: "https://example.org/c.xml", identifier: "c" }),
        ]);
      }),
    );

    it.effect(
      "files lists every file a host may serve and no QTI resource's document: an item named *.html is accepted, and its document, the test's and the stimulus's stay out while the item's image and a web page stay in",
      () =>
        Effect.gen(function* servable() {
          const verdict = yield* openPackage(
            location,
            packageOf({
              [manifestFile]: manifestXml(
                resourceXml("T", "imsqti_test_xmlv3p0", "tests/test.xml"),
                '<resource identifier="Q" type="imsqti_item_xmlv3p0" href="items/q.html"><file href="items/q.html"/><file href="items/img.png"/></resource>',
                resourceXml("S", "imsqti_stimulus_xmlv3p0", "stimuli/s.xml"),
                resourceXml("W", "webcontent", "shared/page.html"),
              ),
              "items/img.png": "PNG",
              "items/q.html": itemXml("q", "SCORE"),
              "shared/page.html": "<p>page</p>",
              "stimuli/s.xml": `<qti-assessment-stimulus xmlns="${qti}" identifier="s" title="s"><qti-stimulus-body><p>s</p></qti-stimulus-body></qti-assessment-stimulus>`,
              "tests/test.xml": testXml("q.SCORE", ["q", "../items/q.html"]),
            }),
          );
          const accepted = acceptedOf(verdict);

          assert.deepStrictEqual(documentKind(resourceOf(verdict, "Q")), Option.some("item"));
          assert.isTrue(accepted.items.has(fileLocation(location, "items/q.html")));
          assert.lengthOf(accepted.stimuli, 1);
          assert.deepStrictEqual([...accepted.files].toSorted(), [
            "items/img.png",
            "shared/page.html",
          ]);
        }),
    );

    it.effect(
      "files leaves out the document of every QTI resource type, outcome declarations, response processing, a response-processing template and a fragment among them, and keeps a file such a resource lists besides its document",
      () =>
        Effect.gen(function* everyQtiDocument() {
          const verdict = yield* openPackage(
            location,
            packageOf({
              [manifestFile]: manifestXml(
                resourceXml("A", "imsqti_item_xmlv3p0", "items/a.xml"),
                resourceXml("O", "imsqti_outcomes_xmlv3p0", "shared/outcomes.xml"),
                '<resource identifier="R" type="imsqti_resprocessing_xmlv3p0" href="shared/rp.xml"><file href="shared/rp.xml"/><file href="shared/rp.css"/></resource>',
                resourceXml("RT", "imsqti_rptemplate_xmlv3p0", "shared/template.xml"),
                resourceXml("F", "imsqti_fragment_xmlv3p0", "shared/fragment.xml"),
              ),
              "items/a.xml": itemXml("a", "SCORE"),
              "shared/fragment.xml": `<p xmlns="${qti}">fragment</p>`,
              "shared/outcomes.xml": `<qti-outcome-declaration xmlns="${qti}" identifier="SCORE" cardinality="single" base-type="float"/>`,
              "shared/rp.css": "p {}",
              "shared/rp.xml": `<qti-response-processing xmlns="${qti}"><qti-set-outcome-value identifier="SCORE"><qti-base-value base-type="float">1</qti-base-value></qti-set-outcome-value></qti-response-processing>`,
              "shared/template.xml": `<qti-response-processing xmlns="${qti}"/>`,
            }),
          );
          const accepted = acceptedOf(verdict);

          assert.deepStrictEqual([...accepted.files], ["shared/rp.css"]);
        }),
    );

    it.effect(
      "files leaves out every file a QTI resource without href lists, its document among them, while a QTI resource with href keeps the files it lists besides its document",
      () =>
        Effect.gen(function* hrefless() {
          const verdict = yield* openPackage(
            location,
            packageOf({
              [manifestFile]: manifestXml(
                '<resource identifier="H" type="imsqti_item_xmlv3p0"><file href="items/q.html"/><file href="items/q.png"/></resource>',
                '<resource identifier="A" type="imsqti_item_xmlv3p0" href="items/a.xml"><file href="items/a.xml"/><file href="items/a.png"/></resource>',
              ),
              "items/a.png": "PNG",
              "items/a.xml": itemXml("a", "SCORE"),
              "items/q.html": `<qti-assessment-item xmlns="${qti}" identifier="q" title="q" adaptive="false" time-dependent="false"><qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier"><qti-correct-response><qti-value>A</qti-value></qti-correct-response></qti-response-declaration><qti-item-body><p>q</p></qti-item-body></qti-assessment-item>`,
              "items/q.png": "PNG",
            }),
          );
          const accepted = acceptedOf(verdict);

          assert.isTrue(Option.isNone(resourceOf(verdict, "H").path));
          assert.deepStrictEqual(
            [...accepted.items.keys()],
            [fileLocation(location, "items/a.xml")],
          );
          assert.deepStrictEqual([...accepted.files], ["items/a.png"]);
        }),
    );

    it.effect(
      "files leaves out every file a QTI resource with an absolute href lists, a local document and an image among them, while a QTI resource with a package href keeps the files it lists besides its document",
      () =>
        Effect.gen(function* absoluteHref() {
          const remote = "https://example.org/items/r.xml";
          const verdict = yield* openPackage(
            location,
            packageOf({
              [manifestFile]: manifestXml(
                `<resource identifier="R" type="imsqti_item_xmlv3p0" href="${remote}"><file href="${remote}"/><file href="items/r.xml"/><file href="items/r.png"/></resource>`,
                '<resource identifier="A" type="imsqti_item_xmlv3p0" href="items/a.xml"><file href="items/a.xml"/><file href="items/a.png"/></resource>',
              ),
              "items/a.png": "PNG",
              "items/a.xml": itemXml("a", "SCORE"),
              "items/r.png": "PNG",
              "items/r.xml": itemXml("r", "SCORE"),
            }),
          );
          const accepted = acceptedOf(verdict);

          assert.isTrue(Option.isNone(resourceOf(verdict, "R").path));
          assert.deepStrictEqual(
            [...accepted.items.keys()],
            [fileLocation(location, "items/a.xml")],
          );
          assert.deepStrictEqual([...accepted.files], ["items/a.png"]);
        }),
    );

    it.effect("refuses a hand-built map holding ../x as package-path-outside", () =>
      Effect.gen(function* outside() {
        const verdict = yield* openPackage(
          location,
          packageOf({ "../x": "", [manifestFile]: manifestXml() }),
        );

        assert.deepStrictEqual(
          refusalsOf(verdict).map((refusal) => refusal.rule),
          ["package-path-outside"],
        );
      }),
    );

    it.effect(
      "refuses an item none of whose LOM identifier entries is its identifier as lom-identifier, at the LOM identifier (reading 62)",
      () =>
        Effect.gen(function* lomIdentifier() {
          const open = (general: string) =>
            openPackage(
              location,
              packageOf({
                [manifestFile]: manifestXml(
                  describedXml("A", "imsqti_item_xmlv3p0", "items/a.xml", general),
                ),
                "items/a.xml": itemXml("a"),
              }),
            );
          const facts = { identifier: "a", path: "items/a.xml", reading: "62", resource: "A" };

          assert.deepStrictEqual(refusalsOf(yield* open(lomIdentifiers("other"))), [
            {
              detail: { ...facts, metadata: "other" },
              document: fileLocation(location, manifestFile),
              location: { kind: "path", path: `${generalAt(soleResource)}/${lomStep}identifier` },
              rule: "lom-identifier",
            },
          ]);
          assert.deepStrictEqual(refusalsOf(yield* open(lomIdentifiers(" x\n y ", "b"))), [
            {
              detail: { ...facts, metadata: "x y", others: "1" },
              document: fileLocation(location, manifestFile),
              location: {
                kind: "path",
                path: `${generalAt(soleResource)}/${lomStep}identifier[1]`,
              },
              rule: "lom-identifier",
            },
          ]);
          assert.deepStrictEqual(
            documentVerdict(resourceOf(yield* open(lomIdentifiers("other")), "A")),
            Option.some("accepted"),
          );
        }),
    );

    it.effect(
      "refuses an item's and a test's LOM title that is not their title as lom-title (reading 62)",
      () =>
        Effect.gen(function* lomTitles() {
          const verdict = yield* openPackage(
            location,
            packageOf({
              [manifestFile]: manifestXml(
                describedXml("T", "imsqti_test_xmlv3p0", "test.xml", lomTitle("Test", "Prüfung")),
                describedXml("A", "imsqti_item_xmlv3p0", "items/a.xml", lomTitle("Item A")),
              ),
              "items/a.xml": itemXml("a", "SCORE"),
              "test.xml": testXml("a.SCORE", ["a", "items/a.xml"]),
            }),
          );
          assert.deepStrictEqual(refusalsOf(verdict), [
            {
              detail: {
                metadata: "Test",
                others: "1",
                path: "test.xml",
                reading: "62",
                resource: "T",
                title: "T",
              },
              document: fileLocation(location, manifestFile),
              location: { kind: "path", path: `${generalAt(resourceAt(1))}/${lomStep}title` },
              rule: "lom-title",
            },
            {
              detail: {
                metadata: "Item A",
                path: "items/a.xml",
                reading: "62",
                resource: "A",
                title: "a",
              },
              document: fileLocation(location, manifestFile),
              location: { kind: "path", path: `${generalAt(resourceAt(2))}/${lomStep}title` },
              rule: "lom-title",
            },
          ]);
        }),
    );

    it.effect(
      "opens a package whose LOM gives a matching entry and string, or no identifier or title, and passes over a stimulus's LOM (reading 62)",
      () =>
        Effect.gen(function* lomOutside() {
          const verdict = yield* openPackage(
            location,
            packageOf({
              [manifestFile]: manifestXml(
                describedXml(
                  "A",
                  "imsqti_item_xmlv3p0",
                  "items/a.xml",
                  `${lomIdentifiers("x", " a\t")}${lomTitle("x", "  a ")}`,
                ),
                describedXml(
                  "B",
                  "imsqti_item_xmlv3p0",
                  "items/b.xml",
                  "<description><string>No identifier or title</string></description>",
                ),
                '<resource identifier="C" type="imsqti_item_xmlv3p0" href="items/c.xml"><metadata/><file href="items/c.xml"/></resource>',
                describedXml(
                  "S",
                  "imsqti_stimulus_xmlv3p0",
                  "passages/s.xml",
                  `${lomIdentifiers("other")}${lomTitle("Other")}`,
                ),
              ),
              "items/a.xml": itemXml("a"),
              "items/b.xml": itemXml("b"),
              "items/c.xml": itemXml("c"),
              "passages/s.xml": `<qti-assessment-stimulus xmlns="${qti}" identifier="s" title="s"><qti-stimulus-body><p>s</p></qti-stimulus-body></qti-assessment-stimulus>`,
            }),
          );

          assert.lengthOf(acceptedOf(verdict).items, 3);
        }),
    );

    it.effect(
      "refuses metaData by both rules and CASEWithOutcome by lom-title at its one item (reading 62)",
      () =>
        Effect.gen(function* lomCorpus() {
          const { metaData } = corpusPackages;
          const metaDataItem = { path: "choice.xml", reading: "62", resource: "choice" };
          const { caseWithOutcome } = corpusPackages;

          assert.deepStrictEqual(unlocated(yield* openCorpusPackage(metaData)), [
            {
              detail: { ...metaDataItem, identifier: "choice", metadata: "qti_v2_item_01" },
              document: fileLocation(metaData, manifestFile),
              rule: "lom-identifier",
            },
            {
              detail: {
                ...metaDataItem,
                metadata: "Metadata Example Item #1",
                title: "Unattended Luggage",
              },
              document: fileLocation(metaData, manifestFile),
              rule: "lom-title",
            },
          ]);
          assert.deepStrictEqual(unlocated(yield* openCorpusPackage(caseWithOutcome)), [
            {
              detail: {
                metadata: "Item Using Curriculum Metadata Standards Anotation",
                path: "A_403910368.xml",
                reading: "62",
                resource: "A_403910368",
                title: "films - to watch (Simple Present)",
              },
              document: fileLocation(caseWithOutcome, manifestFile),
              rule: "lom-title",
            },
          ]);
        }),
    );
  });

  describe("acceptPackageForTest", () => {
    it("brands the contents it is given, the one seam besides openPackage", () => {
      const contents = {
        files: new Set<string>(),
        items: new Map(),
        location,
        stimuli: new Map(),
        tests: new Map(),
        version: "3.0.0",
      } as const;
      // @ts-expect-error -- an AcceptedPackage comes from openPackage or this seam, never by hand.
      const byHand: AcceptedPackage = contents;

      assert.deepStrictEqual(acceptPackageForTest(contents), byHand);
    });
  });
});

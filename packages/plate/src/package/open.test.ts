import { readdir } from "node:fs/promises";
import path from "node:path";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { corpusRoot, readCorpusFile } from "#plate/document/corpus.ts";
import { readSource } from "#plate/document/read.ts";
import { manifestNamespace, readManifest } from "#plate/package/manifest.ts";
import { acceptPackageForTest, itemRefs, openPackage } from "#plate/package/open.ts";
import type {
  AcceptedPackage,
  PackageResource,
  PackageTest,
  PackageVerdict,
} from "#plate/package/open.ts";
import { fileLocation, manifestFile } from "#plate/package/store.ts";
import type { Location, Refusal } from "#plate/validate/refusal.ts";

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

describe("package/open.ts", () => {
  describe("openPackage", () => {
    it.effect(
      "[P-1] [P-4] BegGuide_March2025 is accepted, its BGtest.xml resolving six items",
      () =>
        Effect.gen(function* begGuide() {
          const directory = corpusPackages.begGuide;
          const verdict = yield* openPackage(directory, yield* corpusPackage(directory));
          const accepted = acceptedOf(verdict);
          const bgTest = testOf(accepted, "BGtest.xml");

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
              .filter((file) => file !== manifestFile)
              .toSorted(),
          );
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
        const test = accepted.tests.get("test.xml");

        assert.deepStrictEqual(
          [...(test?.items ?? new Map()).keys()],
          ["a", "a.b"],
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

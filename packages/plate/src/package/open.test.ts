import { readdir } from "node:fs/promises";
import path from "node:path";
import { memoryUsage } from "node:process";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { corpusRoot, readCorpusFile } from "#plate/document/corpus.ts";
import { directoryOf, pathOf, resolveIn, resolveInside } from "#plate/document/href.ts";
import { readSource } from "#plate/document/read.ts";
import { readManifest } from "#plate/package/manifest.ts";
import { acceptPackageForTest, openPackage } from "#plate/package/open.ts";
import type {
  AcceptedPackage,
  PackageResource,
  PackageTest,
  PackageVerdict,
} from "#plate/package/open.ts";
import { fileLocation, manifestFile } from "#plate/package/store.ts";
import { itemRefs } from "#plate/session/item-refs.ts";
import {
  cpuMillis,
  growthFactor,
  growthLimit,
  growthRatio,
  growthRuns,
} from "#plate/test/growth.ts";
import { open as openDocument } from "#plate/validate/open.ts";
import type { Location, Refusal } from "#plate/validate/refusal.ts";
import { describeRefusal } from "#plate/validate/verdict.ts";
import type { AcceptedTest } from "#plate/validate/verdict.ts";
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
 * Take every refusal of a package verdict whole, none when it is not refused, for a test that
 * words it.
 *
 * @param verdict The package verdict.
 * @returns The refusals, in order.
 */
const refusalsIn = (verdict: PackageVerdict): readonly Refusal[] =>
  verdict.verdict === "refused" ? verdict.refusals : [];

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
 * Write an item whose identifier is `a` with a given title and further root attributes.
 *
 * @param title The item's title, as written in the attribute.
 * @param attributes Further attributes of its root, as written, each after a space.
 * @returns The item's text.
 */
const titledItemXml = (title: string, attributes = ""): string =>
  `<qti-assessment-item xmlns="${qti}" identifier="a" title="${title}" adaptive="false" time-dependent="false"${attributes}><qti-item-body><p>a</p></qti-item-body></qti-assessment-item>`;

/**
 * Write an item whose identifier and title are `a`, which writes `xml:lang="en"`, whose body's one
 * `p` writes further attributes, and whose catalog `c` holds one card.
 *
 * @param body Further attributes of the body's `p`, as written, each after a space.
 * @param card The catalog's card, as written.
 * @returns The item's text.
 */
const catalogItemXml = (body: string, card: string): string =>
  `<qti-assessment-item xmlns="${qti}" identifier="a" title="a" adaptive="false" time-dependent="false" xml:lang="en"><qti-item-body><p${body}>a</p></qti-item-body><qti-catalog-info><qti-catalog id="c">${card}</qti-catalog></qti-catalog-info></qti-assessment-item>`;

/**
 * Write a LOM `general`'s title, one `string` for each language and value, each writing its
 * `language`.
 *
 * @param strings Each string's `language` and value.
 * @returns The title's text.
 */
const languageStrings = (...strings: readonly (readonly [language: string, value: string])[]) =>
  `<title>${strings.map(([language, value]) => `<string language="${language}">${value}</string>`).join("")}</title>`;

/**
 * Open a package of one item resource `A`, whose document `items/a.xml` is the given item and whose
 * own LOM record's `general` holds what is given.
 *
 * @param item The item's text.
 * @param general What the LOM record's `general` holds.
 * @returns The package's verdict.
 */
const openDescribed = (item: string, general: string) =>
  openPackage(
    location,
    packageOf({
      "items/a.xml": item,
      [manifestFile]: manifestXml(describedXml("A", "imsqti_item_xmlv3p0", "items/a.xml", general)),
    }),
  );

/**
 * Take the refusals of a package verdict under some rules, as these tests compare them.
 *
 * @param verdict The package verdict.
 * @param rules The rules.
 * @returns The refusals under one of them, in order.
 */
const refusedUnder = (verdict: PackageVerdict, ...rules: readonly string[]): Seen[] =>
  refusalsOf(verdict).filter((refusal) => rules.includes(refusal.rule));

/**
 * The refusal of the root of {@link openDescribed}'s item that writes no `identifier` or no
 * `title` beside a LOM record that gives one (reading 148).
 *
 * @param rule `lom-identifier` or `lom-title`.
 * @param attribute The attribute the root does not write.
 * @returns The refusal, as these tests compare it.
 */
const unwrittenAt = (rule: string, attribute: string): Seen => ({
  detail: { attribute, check: "unwritten", path: "items/a.xml", reading: "148", resource: "A" },
  document: fileLocation(location, "items/a.xml"),
  location: { kind: "path", path: "qti-assessment-item" },
  rule,
});

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
    "items/a.xml": itemXml("a", ...declaredInA),
    "items/ab.xml": itemXml("ab", "SCORE"),
    [manifestFile]: manifestXml(
      resourceXml("T", "imsqti_test_xmlv3p0", "test.xml"),
      resourceXml("A", "imsqti_item_xmlv3p0", "items/a.xml"),
      resourceXml("AB", "imsqti_item_xmlv3p0", "items/ab.xml"),
    ),
    "test.xml": testXml("a.b.SCORE", ["a", "items/a.xml"], ["a.b", "items/ab.xml"]),
  });

/**
 * A `qti-selection` with replacement, which lets each item ref of its section be instantiated more
 * than once, so a numbered reading through it counts (reading 88).
 */
const replacingSelection = '<qti-selection select="2" with-replacement="true"/>';

/**
 * A package whose test's item refs are `a` and `a.2` and whose section is `a.S`, and whose outcome
 * processing reads a given reference: item `a` declares `SCORE` and `S.duration`, and item `a.2`
 * declares `SCORE`.
 *
 * @param reference The reference the test's outcome processing reads.
 * @param selection What the section holds before its item refs, as written: a
 *   {@link replacingSelection} lets a numbered reading through `a` count.
 * @returns The package's files.
 */
const formsPackage = (reference: string, selection = ""): ReadonlyMap<string, Uint8Array> =>
  packageOf({
    "items/a.xml": itemXml("a", "SCORE", "S.duration"),
    "items/a2.xml": itemXml("a2", "SCORE"),
    [manifestFile]: manifestXml(
      resourceXml("T", "imsqti_test_xmlv3p0", "test.xml"),
      resourceXml("A", "imsqti_item_xmlv3p0", "items/a.xml"),
      resourceXml("A2", "imsqti_item_xmlv3p0", "items/a2.xml"),
    ),
    "test.xml": testXml(reference, ["a", "items/a.xml"], ["a.2", "items/a2.xml"]).replace(
      'identifier="S" title="S" visible="true">',
      `identifier="a.S" title="S" visible="true">${selection}`,
    ),
  });

/**
 * Write a test of one part `P` and one section `SEC` holding the given item refs, which declares a
 * float outcome `TOTAL` and the given further declarations, and whose outcome processing sets
 * `TOTAL` to an expression.
 *
 * @param expression The expression `TOTAL` is set to, as written.
 * @param declarations The test's further declarations, as written.
 * @param refs Each item ref, as written.
 * @returns The test's text.
 */
const readingTestXml = (
  expression: string,
  declarations: string,
  ...refs: readonly string[]
): string =>
  `<qti-assessment-test xmlns="${qti}" identifier="T" title="T"><qti-outcome-declaration identifier="TOTAL" cardinality="single" base-type="float"/>${declarations}<qti-test-part identifier="P" navigation-mode="linear" submission-mode="individual"><qti-assessment-section identifier="SEC" title="SEC" visible="true">${refs.join("")}</qti-assessment-section></qti-test-part><qti-outcome-processing><qti-set-outcome-value identifier="TOTAL">${expression}</qti-set-outcome-value></qti-outcome-processing></qti-assessment-test>`;

/**
 * Write an item ref of a test.
 *
 * @param identifier The item ref's identifier.
 * @param href Its `href`.
 * @param content What it holds, as written.
 * @returns The item ref's text.
 */
const itemRefXml = (identifier: string, href: string, content = ""): string =>
  `<qti-assessment-item-ref identifier="${identifier}" href="${href}">${content}</qti-assessment-item-ref>`;

/**
 * A package of one test at `test.xml` and the given items, each listed as an item resource.
 *
 * @param test The test's text.
 * @param items Each item's text, keyed by its path.
 * @returns The package's files.
 */
const readingPackage = (
  test: string,
  items: Readonly<Record<string, string>>,
): ReadonlyMap<string, Uint8Array> =>
  packageOf({
    [manifestFile]: manifestXml(
      resourceXml("T", "imsqti_test_xmlv3p0", "test.xml"),
      ...Object.keys(items).map((itemPath, index) =>
        resourceXml(`I${index + 1}`, "imsqti_item_xmlv3p0", itemPath),
      ),
    ),
    ...items,
    "test.xml": test,
  });

/**
 * The path of the expression `readingTestXml`'s outcome processing sets `TOTAL` to, by its local
 * name.
 *
 * @param local The expression's local name.
 * @returns Its path.
 */
const expressionAt = (local: string): string =>
  `qti-assessment-test/qti-outcome-processing/qti-set-outcome-value/${local}`;

/**
 * The path of a child of `readingTestXml`'s one item ref, by its path step.
 *
 * @param step The child's path step, such as `qti-variable-mapping[2]`.
 * @returns Its path.
 */
const itemRefChildAt = (step: string): string =>
  `qti-assessment-test/qti-test-part/qti-assessment-section/qti-assessment-item-ref/${step}`;

/**
 * A package whose test's outcome processing reads `ITEM1.SCORE` through its one item ref `ITEM1`,
 * which holds the given variable mappings, to the given item at `items/a.xml`.
 *
 * @param mappings The item ref's variable mappings, as written.
 * @param item The item's text.
 * @returns The package's files.
 */
const mappingPackage = (mappings: string, item: string): ReadonlyMap<string, Uint8Array> =>
  readingPackage(
    readingTestXml(
      '<qti-variable identifier="ITEM1.SCORE"/>',
      "",
      itemRefXml("ITEM1", "items/a.xml", mappings),
    ),
    { "items/a.xml": item },
  );

/**
 * A package whose test's outcome processing reads a reference, beside one item ref `a` whose item
 * declares `SCORE`.
 *
 * @param reference The reference the test reads.
 * @returns The package's files.
 */
const readingThroughA = (reference: string): ReadonlyMap<string, Uint8Array> =>
  readingPackage(
    readingTestXml(`<qti-variable identifier="${reference}"/>`, "", itemRefXml("a", "items/a.xml")),
    { "items/a.xml": itemXml("a", "SCORE") },
  );

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

/**
 * Report whether the verdict on the test document of a package `readingPackage` builds, as `open`
 * gives it for that document alone, accepts it: `accepted`, or `accepted-with-unsupported` while a
 * test's processing is marked.
 *
 * @param verdict The package verdict.
 * @returns Whether the test alone is accepted.
 */
const acceptedAlone = (verdict: PackageVerdict): boolean =>
  Option.exists(
    documentVerdict(resourceOf(verdict, "T")),
    (alone) => alone === "accepted" || alone === "accepted-with-unsupported",
  );

/**
 * The item `ITEM1` reaches: an identifier, an integer, a mapped identifier and a point response,
 * a float, a boolean and an integer outcome, and an integer template variable `T`.
 */
const reachedItemXml = `<qti-assessment-item xmlns="${qti}" identifier="a" title="a" adaptive="false" time-dependent="false"><qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier"/><qti-response-declaration identifier="COUNT" cardinality="single" base-type="integer"/><qti-response-declaration identifier="MAPPED" cardinality="single" base-type="identifier"><qti-mapping default-value="0"><qti-map-entry map-key="A" mapped-value="1"/></qti-mapping></qti-response-declaration><qti-response-declaration identifier="POINT" cardinality="single" base-type="point"/><qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/><qti-outcome-declaration identifier="CORRECT" cardinality="single" base-type="boolean"/><qti-outcome-declaration identifier="FIGURES" cardinality="single" base-type="integer"/><qti-template-declaration identifier="T" cardinality="single" base-type="integer"/><qti-item-body><p>a</p></qti-item-body></qti-assessment-item>`;

/**
 * The item `ITEM2` reaches: a single string, a multiple integer and a single integer outcome.
 */
const otherItemXml = `<qti-assessment-item xmlns="${qti}" identifier="b" title="b" adaptive="false" time-dependent="false"><qti-outcome-declaration identifier="S" cardinality="single" base-type="string"/><qti-outcome-declaration identifier="M" cardinality="multiple" base-type="integer"/><qti-outcome-declaration identifier="N" cardinality="single" base-type="integer"/><qti-item-body><p>b</p></qti-item-body></qti-assessment-item>`;

/**
 * Write a test of one part `P` and one section `SEC` holding the given item refs, which declares a
 * float outcome `TOTAL`, with the given outcome processing.
 *
 * @param processing What the test's outcome processing holds, as written.
 * @param refs Each item ref, as written.
 * @returns The test's text.
 */
const processingTestXml = (processing: string, ...refs: readonly string[]): string =>
  `<qti-assessment-test xmlns="${qti}" identifier="T" title="T"><qti-outcome-declaration identifier="TOTAL" cardinality="single" base-type="float"/><qti-test-part identifier="P" navigation-mode="linear" submission-mode="individual"><qti-assessment-section identifier="SEC" title="SEC" visible="true">${refs.join("")}</qti-assessment-section></qti-test-part><qti-outcome-processing>${processing}</qti-outcome-processing></qti-assessment-test>`;

/**
 * A package whose test, with a float outcome `TOTAL`, holds the item refs `ITEM1`, to
 * {@link reachedItemXml}, and `ITEM2`, to {@link otherItemXml}, and the given outcome processing.
 *
 * @param processing What the test's outcome processing holds, as written.
 * @param firstRef What the item ref `ITEM1` holds, as written.
 * @returns The package's files.
 */
const reachPackage = (processing: string, firstRef = ""): ReadonlyMap<string, Uint8Array> =>
  readingPackage(
    processingTestXml(
      processing,
      itemRefXml("ITEM1", "items/a.xml", firstRef),
      itemRefXml("ITEM2", "items/b.xml"),
    ),
    { "items/a.xml": reachedItemXml, "items/b.xml": otherItemXml },
  );

/**
 * Write a rule of outcome processing that sets `TOTAL` to an expression.
 *
 * @param expression The expression, as written.
 * @returns The rule's text.
 */
const settingTotal = (expression: string): string =>
  `<qti-set-outcome-value identifier="TOTAL">${expression}</qti-set-outcome-value>`;

/**
 * The float 1, as a `qti-base-value`.
 */
const oneFloat = '<qti-base-value base-type="float">1</qti-base-value>';

/**
 * The path of a child of {@link reachPackage}'s first item ref `ITEM1`, by its path step.
 *
 * @param step The child's path step.
 * @returns Its path.
 */
const firstRefChildAt = (step: string): string =>
  `qti-assessment-test/qti-test-part/qti-assessment-section/qti-assessment-item-ref[1]/${step}`;

/**
 * Write a `qti-variable` that reads a variable.
 *
 * @param identifier The variable's name.
 * @returns The expression's text.
 */
const variableXml = (identifier: string): string => `<qti-variable identifier="${identifier}"/>`;

/**
 * Write a `qti-round-to` of `ITEM1.SCORE` to as many decimal places as a variable holds.
 *
 * @param figures The variable its `figures` names.
 * @returns The expression's text.
 */
const roundedXml = (figures: string): string =>
  `<qti-round-to figures="${figures}" rounding-mode="decimalPlaces">${variableXml("ITEM1.SCORE")}</qti-round-to>`;

/**
 * Open a {@link reachPackage} whose outcome processing sets `TOTAL` to an expression.
 *
 * @param expression The expression, as written.
 * @returns The package's verdict.
 */
const openSettingTotal = (expression: string) =>
  openPackage(location, reachPackage(settingTotal(expression)));

/**
 * Open a {@link reachPackage} whose item ref `ITEM1` holds one template default.
 *
 * @param target The template default's `template-identifier`.
 * @param expression Its expression, as written.
 * @returns The package's verdict.
 */
const openDefaulting = (target: string, expression: string) =>
  openPackage(
    location,
    reachPackage(
      settingTotal(oneFloat),
      `<qti-template-default template-identifier="${target}">${expression}</qti-template-default>`,
    ),
  );

/**
 * Open a {@link reachPackage} whose outcome processing sets `TOTAL` to 1 when an expression is
 * NULL, so that the expression may be of any type.
 *
 * @param expression The expression `qti-is-null` tests, as written.
 * @returns The package's verdict.
 */
const openTestingNull = (expression: string) =>
  openPackage(
    location,
    reachPackage(
      `<qti-outcome-condition><qti-outcome-if><qti-is-null>${expression}</qti-is-null>${settingTotal(oneFloat)}</qti-outcome-if></qti-outcome-condition>`,
    ),
  );

/**
 * The path of the expression {@link openTestingNull} tests, by its local name.
 *
 * @param local The expression's local name.
 * @returns Its path.
 */
const nullTestedAt = (local: string): string =>
  `qti-assessment-test/qti-outcome-processing/qti-outcome-condition/qti-outcome-if/qti-is-null/${local}`;

/**
 * Write the item the map-response pins reach: a point response `MAPPED_POINT` that declares a
 * `qti-mapping` and no `qti-area-mapping`, a point response `AREA_POINT` that declares a
 * `qti-area-mapping`, and a float outcome `SCORE`.
 *
 * @param timeDependent The item's `time-dependent`, which decides whether its `duration` is read.
 * @param processing The item's response processing, as written after its body.
 * @returns The item's text.
 */
const pointsItemXml = (timeDependent: "false" | "true", processing = ""): string =>
  `<qti-assessment-item xmlns="${qti}" identifier="a" title="a" adaptive="false" time-dependent="${timeDependent}"><qti-response-declaration identifier="MAPPED_POINT" cardinality="single" base-type="point"><qti-mapping default-value="0"><qti-map-entry map-key="1 1" mapped-value="1"/></qti-mapping></qti-response-declaration><qti-response-declaration identifier="AREA_POINT" cardinality="single" base-type="point"><qti-area-mapping default-value="0"><qti-area-map-entry shape="rect" coords="0,0,10,10" mapped-value="1"/></qti-area-mapping></qti-response-declaration><qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/><qti-item-body><p>a</p></qti-item-body>${processing}</qti-assessment-item>`;

/**
 * Open a package whose test, of part `P` and section `SEC`, sets `TOTAL` to an expression through
 * its one item ref `ITEM1`, to {@link pointsItemXml}.
 *
 * @param timeDependent The item's `time-dependent`.
 * @param expression The expression, as written.
 * @returns The package's verdict.
 */
const openSettingThroughPoints = (timeDependent: "false" | "true", expression: string) =>
  openPackage(
    location,
    readingPackage(
      processingTestXml(settingTotal(expression), itemRefXml("ITEM1", "items/a.xml")),
      { "items/a.xml": pointsItemXml(timeDependent) },
    ),
  );

/**
 * Open a package of one item, {@link pointsItemXml}, whose response processing sets `SCORE` to an
 * expression.
 *
 * @param timeDependent The item's `time-dependent`.
 * @param expression The expression, as written.
 * @returns The package's verdict.
 */
const openScoringPoints = (timeDependent: "false" | "true", expression: string) =>
  openPackage(
    location,
    packageOf({
      "items/a.xml": pointsItemXml(
        timeDependent,
        `<qti-response-processing><qti-set-outcome-value identifier="SCORE">${expression}</qti-set-outcome-value></qti-response-processing>`,
      ),
      [manifestFile]: manifestXml(resourceXml("A", "imsqti_item_xmlv3p0", "items/a.xml")),
    }),
  );

/**
 * The path of a test's one outcome rule, by its local name.
 *
 * @param local The rule's local name.
 * @returns Its path.
 */
const ruleAt = (local: string): string => `qti-assessment-test/qti-outcome-processing/${local}`;

/**
 * Write an outcome rule that sets a variable to the float 1.
 *
 * @param local The rule's local name: `qti-set-outcome-value` or `qti-lookup-outcome-value`.
 * @param identifier The variable it sets.
 * @returns The rule's text.
 */
const settingOne = (local: string, identifier: string): string =>
  `<${local} identifier="${identifier}">${oneFloat}</${local}>`;

/**
 * A package whose test, with a float outcome `TOTAL`, holds the item refs `ITEM1`, whose item
 * declares a float outcome `X.SCORE`, and `ITEM1.X`, whose item declares `SCORE`, so that two
 * readings resolve `ITEM1.X.SCORE`, and the given outcome processing.
 *
 * @param processing What the test's outcome processing holds, as written.
 * @returns The package's files.
 */
const nestedRefsPackage = (processing: string): ReadonlyMap<string, Uint8Array> =>
  readingPackage(
    processingTestXml(
      processing,
      itemRefXml("ITEM1", "items/a.xml"),
      itemRefXml("ITEM1.X", "items/ax.xml"),
    ),
    { "items/a.xml": itemXml("a", "X.SCORE"), "items/ax.xml": itemXml("ax", "SCORE") },
  );

/**
 * Write a test `T` of one part `P` holding a section `SEC` with one item ref `ITEM0`, to
 * `items/b.xml`, then the given section refs, which declares a float outcome `TOTAL` and has the
 * given outcome processing.
 *
 * @param processing What the test's outcome processing holds, as written.
 * @param sectionRefs The part's section refs, as written.
 * @returns The test's text.
 */
const referringTestXml = (processing: string, sectionRefs: string): string =>
  `<qti-assessment-test xmlns="${qti}" identifier="T" title="T"><qti-outcome-declaration identifier="TOTAL" cardinality="single" base-type="float"/><qti-test-part identifier="P" navigation-mode="linear" submission-mode="individual"><qti-assessment-section identifier="SEC" title="SEC" visible="true">${itemRefXml("ITEM0", "items/b.xml")}</qti-assessment-section>${sectionRefs}</qti-test-part><qti-outcome-processing>${processing}</qti-outcome-processing></qti-assessment-test>`;

/**
 * Write a section ref of a test.
 *
 * @param identifier The section ref's identifier.
 * @param href Its `href`.
 * @returns The section ref's text.
 */
const sectionRefXml = (identifier: string, href: string): string =>
  `<qti-assessment-section-ref identifier="${identifier}" href="${href}"/>`;

/**
 * Write the section document `S2`, whose one item ref `I1` names `items/a.xml` from the section
 * document's own path, `sections/s2.xml`.
 *
 * @param itemRef What the item ref `I1` holds, as written.
 * @param more What the section holds after the item ref, as written.
 * @returns The section document's text.
 */
const sectionXml = (itemRef = "", more = ""): string =>
  `<qti-assessment-section xmlns="${qti}" identifier="S2" title="S2" visible="true">${itemRefXml("I1", "../items/a.xml", itemRef)}${more}</qti-assessment-section>`;

/**
 * The files of a package whose test, at `test.xml`, holds the given outcome processing and section
 * refs, beside the item `ITEM0` names, {@link otherItemXml} at `items/b.xml`, the item `I1` names,
 * {@link reachedItemXml} at `items/a.xml`, and a section document at `sections/s2.xml`, each listed
 * as a resource of its type.
 *
 * @param processing What the test's outcome processing holds, as written.
 * @param sectionRefs The test part's section refs, as written.
 * @param section The section document's text.
 * @returns The package's files, by path.
 */
const referringFiles = (processing: string, sectionRefs: string, section: string) => ({
  "items/a.xml": reachedItemXml,
  "items/b.xml": otherItemXml,
  [manifestFile]: manifestXml(
    resourceXml("T", "imsqti_test_xmlv3p0", "test.xml"),
    resourceXml("I0", "imsqti_item_xmlv3p0", "items/b.xml"),
    resourceXml("I1", "imsqti_item_xmlv3p0", "items/a.xml"),
    resourceXml("S", "imsqti_section_xmlv3p0", "sections/s2.xml"),
  ),
  "sections/s2.xml": section,
  "test.xml": referringTestXml(processing, sectionRefs),
});

/**
 * Open a package whose test reaches the section document `S2` through one section ref and whose
 * outcome processing is the given one.
 *
 * @param processing What the test's outcome processing holds, as written.
 * @param itemRef What the section document's item ref `I1` holds, as written.
 * @returns The package's verdict.
 */
const openReferring = (processing: string, itemRef = "") =>
  openPackage(
    location,
    packageOf(
      referringFiles(processing, sectionRefXml("R", "sections/s2.xml"), sectionXml(itemRef)),
    ),
  );

/**
 * The path of a child of the section document's item ref `I1`, by its path step.
 *
 * @param step The child's path step.
 * @returns Its path.
 */
const sectionRefChildAt = (step: string): string =>
  `qti-assessment-section/qti-assessment-item-ref/${step}`;

/**
 * The `undeclared-variable` refusal of an attribute of a child of the section document's item ref
 * `I1`.
 *
 * @param step The child's path step.
 * @param attribute The attribute's local name.
 * @param detail The refusal's detail.
 * @returns The refusal's facts.
 */
const atSection = (
  step: string,
  attribute: string,
  detail: Readonly<Record<string, string>>,
): Seen => ({
  detail,
  document: fileLocation(location, "sections/s2.xml"),
  location: { kind: "path", path: `${sectionRefChildAt(step)}/@${attribute}` },
  rule: "undeclared-variable",
});

/**
 * Write a `qti-pre-condition` of an expression.
 *
 * @param expression The expression, as written.
 * @returns The pre-condition's text.
 */
const preConditionXml = (expression: string): string =>
  `<qti-pre-condition>${expression}</qti-pre-condition>`;

/**
 * Write a `qti-gt` of a variable over the float 1, whose operands must each be a single integer or
 * float.
 *
 * @param identifier The variable's name.
 * @returns The expression's text.
 */
const greaterXml = (identifier: string): string =>
  `<qti-gt>${variableXml(identifier)}${oneFloat}</qti-gt>`;

/**
 * The refusal of an element beneath the section document's item ref `I1`.
 *
 * @param rule The refusal's rule.
 * @param step The element's path from the item ref.
 * @param detail The refusal's detail.
 * @returns The refusal's facts.
 */
const inSection = (rule: string, step: string, detail: Readonly<Record<string, string>>): Seen => ({
  detail,
  document: fileLocation(location, "sections/s2.xml"),
  location: { kind: "path", path: sectionRefChildAt(step) },
  rule,
});

/**
 * The files of a package whose tests `T`, at `test.xml`, and `T2`, at `test2.xml`, each reach the
 * section document `S2` through one section ref, each with {@link referringTestXml}'s float `TOTAL`
 * and an outcome processing that sets it to 1.
 *
 * @param itemRef What the section document's item ref `I1` holds, as written.
 * @returns The package's files, by path.
 */
const twoReachingFiles = (itemRef: string) => ({
  ...referringFiles(
    settingTotal(oneFloat),
    sectionRefXml("R", "sections/s2.xml"),
    sectionXml(itemRef),
  ),
  [manifestFile]: manifestXml(
    resourceXml("T", "imsqti_test_xmlv3p0", "test.xml"),
    resourceXml("T2", "imsqti_test_xmlv3p0", "test2.xml"),
    resourceXml("I0", "imsqti_item_xmlv3p0", "items/b.xml"),
    resourceXml("I1", "imsqti_item_xmlv3p0", "items/a.xml"),
    resourceXml("S", "imsqti_section_xmlv3p0", "sections/s2.xml"),
  ),
  "test2.xml": referringTestXml(
    settingTotal(oneFloat),
    sectionRefXml("R", "sections/s2.xml"),
  ).replace('identifier="T" title="T"', 'identifier="T2" title="T2"'),
});

/**
 * The files of a package whose test `T`, at `test.xml`, reaches the section document `S2` at
 * `sections/s2.xml`, and whose test `T2`, at `test2.xml`, reaches the section document `S3` at
 * `sections/s3.xml`, each through one section ref, each section document's one item ref `I1` naming
 * `items/a.xml` from its own path.
 *
 * @param inS2 What `S2`'s item ref `I1` holds, as written.
 * @param inS3 What `S3`'s item ref `I1` holds, as written.
 * @returns The package's files, by path.
 */
const twoSectionFiles = (inS2: string, inS3: string) => ({
  ...twoReachingFiles(inS2),
  [manifestFile]: manifestXml(
    resourceXml("T", "imsqti_test_xmlv3p0", "test.xml"),
    resourceXml("T2", "imsqti_test_xmlv3p0", "test2.xml"),
    resourceXml("I0", "imsqti_item_xmlv3p0", "items/b.xml"),
    resourceXml("I1", "imsqti_item_xmlv3p0", "items/a.xml"),
    resourceXml("S", "imsqti_section_xmlv3p0", "sections/s2.xml"),
    resourceXml("S3", "imsqti_section_xmlv3p0", "sections/s3.xml"),
  ),
  "sections/s3.xml": sectionXml(inS3).replace(
    'identifier="S2" title="S2"',
    'identifier="S3" title="S3"',
  ),
  "test2.xml": referringTestXml(
    settingTotal(oneFloat),
    sectionRefXml("R", "sections/s3.xml"),
  ).replace('identifier="T" title="T"', 'identifier="T2" title="T2"'),
});

/**
 * Write a section document of one section, `title` its identifier, holding what is given.
 *
 * @param identifier The section's identifier.
 * @param content What the section holds, as written.
 * @returns The section document's text.
 */
const sectionDocumentXml = (identifier: string, content: string): string =>
  `<qti-assessment-section xmlns="${qti}" identifier="${identifier}" title="${identifier}" visible="true">${content}</qti-assessment-section>`;

/**
 * The files of a package whose test `T`, {@link referringTestXml} with the given outcome
 * processing, reaches each given section document through a section ref of its own, in order: each
 * at `sections/<identifier>.xml` and listed as a section resource, beside the items `items/a.xml`
 * ({@link reachedItemXml}) and `items/b.xml` ({@link otherItemXml}).
 *
 * @param processing What the test's outcome processing holds, as written.
 * @param sections Each section document's identifier and what its section holds, as written.
 * @returns The package's files, by path.
 */
const reachingFiles = (
  processing: string,
  ...sections: readonly (readonly [identifier: string, content: string])[]
) => ({
  "items/a.xml": reachedItemXml,
  "items/b.xml": otherItemXml,
  [manifestFile]: manifestXml(
    resourceXml("T", "imsqti_test_xmlv3p0", "test.xml"),
    resourceXml("I0", "imsqti_item_xmlv3p0", "items/b.xml"),
    resourceXml("I1", "imsqti_item_xmlv3p0", "items/a.xml"),
    ...sections.map(([identifier]) =>
      resourceXml(identifier, "imsqti_section_xmlv3p0", `sections/${identifier}.xml`),
    ),
  ),
  ...Object.fromEntries(
    sections.map(([identifier, content]) => [
      `sections/${identifier}.xml`,
      sectionDocumentXml(identifier, content),
    ]),
  ),
  "test.xml": referringTestXml(
    processing,
    sections
      .map(([identifier]) => sectionRefXml(`R${identifier}`, `sections/${identifier}.xml`))
      .join(""),
  ),
});

/**
 * The `duplicate-identifier` refusal of an identifier a section document gives again after the
 * test, or a section document reached before it, gave it.
 *
 * @param file The section document's path.
 * @param element The path of the element whose `identifier` repeats it, from the section document's
 *   root.
 * @param identifier The identifier.
 * @returns The refusal's facts.
 */
const duplicateIn = (file: string, element: string, identifier: string): Seen => ({
  detail: { identifier },
  document: fileLocation(location, file),
  location: { kind: "path", path: `${element}/@identifier` },
  rule: "duplicate-identifier",
});

/**
 * Write an outcome processing that sets `TOTAL` to 1 when a part's or a section's `duration` is
 * NULL, so that the duration may be read whatever its type.
 *
 * @param scope The part's or section's identifier.
 * @returns The outcome processing's text.
 */
const testingDuration = (scope: string): string =>
  `<qti-outcome-condition><qti-outcome-if><qti-is-null>${variableXml(`${scope}.duration`)}</qti-is-null>${settingTotal(oneFloat)}</qti-outcome-if></qti-outcome-condition>`;

/**
 * Each long chain of section refs gets this bound, as its own: opening 8,000 section documents,
 * or judging the 2,048 that plate's assembly limit admits, takes about a second here, and the
 * bound leaves room for a slow machine.
 */
const chainTimeoutMs = 120_000;

/**
 * The files of a package whose test `T`, {@link referringTestXml}, reaches a chain of section
 * documents: its section ref names `sections/s0.xml`, and each section document `X<n>`, at
 * `sections/s<n>.xml`, holds one item ref `I<n>` to `items/a.xml` and, but the last, a section ref
 * to the next. The test's outcome processing reads the last item ref's `SCORE`, which only the end
 * of the chain holds.
 *
 * @param length How many section documents the chain holds.
 * @returns The package's files.
 */
const chainPackage = (length: number): ReadonlyMap<string, Uint8Array> => {
  const indices = Array.from({ length }, (_, index) => index);

  return packageOf({
    "items/a.xml": reachedItemXml,
    "items/b.xml": otherItemXml,
    [manifestFile]: manifestXml(
      resourceXml("T", "imsqti_test_xmlv3p0", "test.xml"),
      resourceXml("I0", "imsqti_item_xmlv3p0", "items/b.xml"),
      resourceXml("I1", "imsqti_item_xmlv3p0", "items/a.xml"),
      ...indices.map((index) =>
        resourceXml(`S${index}`, "imsqti_section_xmlv3p0", `sections/s${index}.xml`),
      ),
    ),
    ...Object.fromEntries(
      indices.map((index) => [
        `sections/s${index}.xml`,
        sectionDocumentXml(
          `X${index}`,
          `${itemRefXml(`I${index}`, "../items/a.xml")}${index + 1 < length ? sectionRefXml(`R${index + 1}`, `s${index + 1}.xml`) : ""}`,
        ),
      ]),
    ),
    "test.xml": referringTestXml(
      settingTotal(variableXml(`I${length - 1}.SCORE`)),
      sectionRefXml("R0", "sections/s0.xml"),
    ),
  });
};

/**
 * Open a {@link chainPackage} and check that its test is accepted, reading the chain's last item
 * ref with its processing marked.
 *
 * @param length How many section documents the chain holds.
 * @returns Nothing; the test fails when the package is not accepted so.
 */
const acceptsChain = (length: number) =>
  Effect.gen(function* chainAccepted() {
    const verdict = yield* openPackage(location, chainPackage(length));
    const { test } = testOf(acceptedOf(verdict), fileLocation(location, "test.xml"));

    assert.strictEqual(verdict.verdict, "accepted-with-unsupported");
    assert.deepStrictEqual(
      test.unsupported.map((feature) => feature.feature),
      ["qti-assessment-section-ref", `variable:I${length - 1}.SCORE`],
    );
  });

/**
 * The template default of the section document's integer template variable `T` to the float 1,
 * whose type is not its target's.
 */
const floatDefaultXml = `<qti-template-default template-identifier="T">${oneFloat}</qti-template-default>`;

/**
 * The P8 refusal of the section document's pre-condition over `NOPE`, which no test declares, so
 * the reaching test is its declarer.
 */
const undeclaredNope = inSection("undeclared-variable", "qti-pre-condition/qti-variable", {
  declarer: "test",
  element: "qti-variable",
  expected: "variable",
  identifier: "NOPE",
});

/**
 * The P20 refusal of {@link floatDefaultXml}.
 */
const floatDefaultRefused = inSection("expression-type", "qti-template-default", {
  element: "qti-template-default",
  expressionBaseType: "float",
  expressionCardinality: "single",
  identifier: "T",
  outcomeBaseType: "integer",
  outcomeCardinality: "single",
  targetKind: "template",
});

/**
 * Open a {@link reachPackage} whose outcome processing sets `ITEM1.SCORE` by a
 * `qti-lookup-outcome-value` of an expression.
 *
 * @param expression The expression, as written.
 * @returns The package's verdict.
 */
const openLookingUp = (expression: string) =>
  openPackage(
    location,
    reachPackage(
      `<qti-lookup-outcome-value identifier="ITEM1.SCORE">${expression}</qti-lookup-outcome-value>`,
    ),
  );

/**
 * Take the facts of each refusal of a package verdict the dotted lookup cases compare.
 *
 * @param verdict The package verdict.
 * @returns Each refusal's rule, element, identifier, reading, table, document and location.
 */
const lookupFacts = (verdict: PackageVerdict) =>
  refusalsOf(verdict).map(({ detail, document, location: at, rule }) => [
    rule,
    detail["element"],
    detail["identifier"],
    detail["reading"],
    detail["table"],
    document,
    at,
  ]);

/**
 * Open an {@link openTestingNull} package whose tested expression is a `qti-pattern-match` of
 * `ITEM2.S`, a string, against a pattern.
 *
 * @param pattern The `pattern`, as written.
 * @returns The package's verdict.
 */
const openMatching = (pattern: string) =>
  openTestingNull(
    `<qti-pattern-match pattern="${pattern}">${variableXml("ITEM2.S")}</qti-pattern-match>`,
  );

/**
 * The item the context read cases' item ref `first` names: `I1`, which declares the single float
 * context variable `CTX`, defaulting to 4.5, and the single float outcome `SCORE`.
 */
const contextItemXml = `<qti-assessment-item xmlns="${qti}" identifier="I1" title="I1" adaptive="false" time-dependent="false"><qti-context-declaration identifier="CTX" cardinality="single" base-type="float"><qti-default-value><qti-value>4.5</qti-value></qti-default-value></qti-context-declaration><qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/><qti-item-body><p>I1</p></qti-item-body></qti-assessment-item>`;

/**
 * The item the context read cases' item ref `second` names: `I2`, which declares the single float
 * template variables `T` and `U` and the single float outcome `SCORE`.
 */
const templatedItemXml = `<qti-assessment-item xmlns="${qti}" identifier="I2" title="I2" adaptive="false" time-dependent="false"><qti-template-declaration identifier="T" cardinality="single" base-type="float"/><qti-template-declaration identifier="U" cardinality="single" base-type="float"/><qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/><qti-item-body><p>I2</p></qti-item-body></qti-assessment-item>`;

/**
 * Open a package of the probe's shape: a test whose outcome processing sets `TOTAL` to an
 * expression, with the item ref `first` to {@link contextItemXml} and the item ref `second`, holding
 * the given children, to {@link templatedItemXml}.
 *
 * @param expression The expression `TOTAL` is set to, as written.
 * @param defaults What `second` holds, as written.
 * @param selection What the section holds before its item refs, as written: a
 *   {@link replacingSelection} lets a numbered reading through `first` count.
 * @returns The package's verdict.
 */
const openContextReading = (expression: string, defaults = "", selection = "") =>
  openPackage(
    location,
    readingPackage(
      readingTestXml(
        expression,
        "",
        selection,
        itemRefXml("first", "items/i1.xml"),
        itemRefXml("second", "items/i2.xml", defaults),
      ),
      { "items/i1.xml": contextItemXml, "items/i2.xml": templatedItemXml },
    ),
  );

/**
 * The path of the outcome processing of a test `readingTestXml` writes.
 */
const processingPath = "qti-assessment-test/qti-outcome-processing";

/**
 * The test of a package `readingPackage` writes, as the package delivers it, and the test its
 * document's own verdict accepts, as `open` gives it alone.
 */
interface DeliveredAndAlone {
  readonly alone: AcceptedTest;
  readonly delivered: AcceptedTest;
}

/**
 * Take the test of a package `readingPackage` writes, as the package delivers it, and the test its
 * document's own verdict accepts, as `open` gives it alone; the test fails when either is missing.
 *
 * @param verdict The package verdict.
 * @returns The delivered test and the document's own.
 */
const deliveredAndAlone = (verdict: PackageVerdict): DeliveredAndAlone => {
  const alone = Option.getOrUndefined(resourceOf(verdict, "T").verdict);
  if (
    alone === undefined ||
    alone.kind !== "test" ||
    (alone.verdict !== "accepted" && alone.verdict !== "accepted-with-unsupported")
  ) {
    return assert.fail("the test document's own verdict accepts it");
  }

  return {
    alone: alone.accepted,
    delivered: testOf(acceptedOf(verdict), fileLocation(location, "test.xml")).test,
  };
};

/**
 * Give the `variable:` marks of a test, each its feature and path.
 *
 * @param test The test.
 * @returns The marks, in order.
 */
const variableMarks = (test: AcceptedTest): readonly (readonly [string, string])[] =>
  test.unsupported.flatMap(({ feature, path: at }) =>
    feature.startsWith("variable:") ? [[feature, at] as const] : [],
  );

/**
 * Open a package whose test's own section holds, after what is given, the item ref `own` to
 * an item, then a section ref to the section document `sections/s.xml`, whose item ref
 * `placed` names item `i2`, which declares `SCORE` and the further declarations given; the
 * test's outcome processing sets `TOTAL` to a name. Item `i1` declares no `SCORE`.
 *
 * @param name The name `TOTAL` is set to.
 * @param own The test's own item ref and the item it names, `items/i1.xml` or `items/i2.xml`.
 * @param placed The section document's item ref.
 * @param before What the test's section holds before `own`, as written.
 * @param declarations What `i2` declares after `SCORE`, as written.
 * @returns The package's verdict.
 */
const openCounting = (
  name: string,
  own: readonly [identifier: string, href: string],
  placed: string,
  before: string,
  declarations: string,
) =>
  openPackage(
    location,
    packageOf({
      "items/i1.xml": `<qti-assessment-item xmlns="${qti}" identifier="i1" title="i1" adaptive="false" time-dependent="false"><qti-outcome-declaration identifier="OTHER" cardinality="single" base-type="float"/><qti-item-body><p>i1</p></qti-item-body></qti-assessment-item>`,
      "items/i2.xml": `<qti-assessment-item xmlns="${qti}" identifier="i2" title="i2" adaptive="false" time-dependent="false"><qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>${declarations}<qti-item-body><p>i2</p></qti-item-body></qti-assessment-item>`,
      [manifestFile]: manifestXml(
        resourceXml("T", "imsqti_test_xmlv3p0", "test.xml"),
        resourceXml("I1", "imsqti_item_xmlv3p0", "items/i1.xml"),
        resourceXml("I2", "imsqti_item_xmlv3p0", "items/i2.xml"),
        resourceXml("S", "imsqti_section_xmlv3p0", "sections/s.xml"),
      ),
      "sections/s.xml": `<qti-assessment-section xmlns="${qti}" identifier="S2" title="S2" visible="true">${itemRefXml(placed, "../items/i2.xml")}</qti-assessment-section>`,
      "test.xml": `<qti-assessment-test xmlns="${qti}" identifier="T" title="T"><qti-outcome-declaration identifier="TOTAL" cardinality="single" base-type="float"/><qti-test-part identifier="P" navigation-mode="linear" submission-mode="individual"><qti-assessment-section identifier="SEC" title="SEC" visible="true">${before}${itemRefXml(...own)}${sectionRefXml("R", "sections/s.xml")}</qti-assessment-section></qti-test-part><qti-outcome-processing>${settingTotal(variableXml(name))}</qti-outcome-processing></qti-assessment-test>`,
    }),
  );

/**
 * Give the template defaults the item ref `second` of a test `openContextReading` writes holds,
 * each the template variable it sets.
 *
 * @param test The test.
 * @returns The variables, in order.
 */
const defaultsOfSecond = (test: AcceptedTest): readonly string[] =>
  test.test.parts
    .flatMap((part) => part.children)
    .flatMap((section) => section.children)
    .flatMap((child) =>
      child.kind === "item-ref" && child.identifier === "second"
        ? child.templateDefaults.map((each) => each.templateIdentifier)
        : [],
    );

/**
 * Give the template defaults an item ref of a test holds, each the template variable it sets.
 *
 * @param test The test.
 * @param itemRef The item ref's identifier.
 * @returns The variables, in order.
 */
const defaultsUnder = (test: AcceptedTest, itemRef: string): readonly string[] =>
  test.test.parts
    .flatMap((part) => part.children)
    .flatMap((section) => section.children)
    .flatMap((child) =>
      child.kind === "item-ref" && child.identifier === itemRef
        ? child.templateDefaults.map((each) => each.templateIdentifier)
        : [],
    );

/**
 * An item whose body holds a `qti-custom-interaction` bound to its declared response, which a
 * QTI 3.0.0 package refuses (P2).
 */
const customItemXml = `<qti-assessment-item xmlns="${qti}" identifier="custom" title="Custom" adaptive="false" time-dependent="false"><qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier"/><qti-item-body><qti-custom-interaction response-identifier="RESPONSE"/></qti-item-body></qti-assessment-item>`;

/**
 * The section refs of a test part that place the section document `S2`, at `sections/s2.xml`,
 * twice: `R1`, then `R2`.
 */
const placedTwice = `${sectionRefXml("R1", "sections/s2.xml")}${sectionRefXml("R2", "sections/s2.xml")}`;

/**
 * Open a package whose test, {@link referringTestXml} with the given outcome processing and section
 * refs, places the section document `S2` at `sections/s2.xml`, whose item ref `I1` holds what is
 * given.
 *
 * @param processing What the test's outcome processing holds, as written.
 * @param sectionRefs The test part's content after its section `SEC`, as written.
 * @param itemRef What the section document's item ref `I1` holds, as written.
 * @returns The package's verdict.
 */
const openPlacing = (processing: string, sectionRefs: string, itemRef = "") =>
  openPackage(location, packageOf(referringFiles(processing, sectionRefs, sectionXml(itemRef))));

/**
 * Open a package whose test `T`, {@link referringTestXml} setting `TOTAL` to 1, holds the given
 * section refs after its section `SEC`, beside the section document `S2` at `sections/s2.xml`, a
 * section resource, and the web page `shared/page.html`, a webcontent resource: with no section
 * ref, no test places the section document.
 *
 * @param sectionRefs The test part's content after its section `SEC`, as written.
 * @param section The section document's text.
 * @returns The package's verdict.
 */
const openListing = (sectionRefs: string, section: string) =>
  openPackage(
    location,
    packageOf({
      ...referringFiles(settingTotal(oneFloat), sectionRefs, section),
      [manifestFile]: manifestXml(
        resourceXml("T", "imsqti_test_xmlv3p0", "test.xml"),
        resourceXml("I0", "imsqti_item_xmlv3p0", "items/b.xml"),
        resourceXml("I1", "imsqti_item_xmlv3p0", "items/a.xml"),
        resourceXml("S", "imsqti_section_xmlv3p0", "sections/s2.xml"),
        resourceXml("W", "webcontent", "shared/page.html"),
      ),
      "shared/page.html": "<p>page</p>",
    }),
  );

/**
 * Write a `qti-branch-rule` to a target, whose expression is the boolean `true`.
 *
 * @param target The rule's `target`.
 * @returns The rule's text.
 */
const branchRuleXml = (target: string): string =>
  `<qti-branch-rule target="${target}"><qti-base-value base-type="boolean">true</qti-base-value></qti-branch-rule>`;

/**
 * Open a package whose test, {@link referringTestXml} setting `TOTAL` to 1, places the section
 * document `S2` through the given part content, with the test's item ref `ITEM0` and the section
 * document's item ref `I1` each holding what is given.
 *
 * @param partContent The test part's content after its section `SEC`, as written.
 * @param onItem0 What the test's item ref `ITEM0` holds, as written.
 * @param onI1 What the section document's item ref `I1` holds, as written.
 * @returns The package's verdict.
 */
const openBranching = (partContent: string, onItem0: string, onI1 = "") =>
  openPackage(
    location,
    packageOf({
      ...referringFiles(settingTotal(oneFloat), partContent, sectionXml(onI1)),
      "test.xml": referringTestXml(settingTotal(oneFloat), partContent).replace(
        itemRefXml("ITEM0", "items/b.xml"),
        itemRefXml("ITEM0", "items/b.xml", onItem0),
      ),
    }),
  );

/**
 * The `branch-target` refusal of a branch rule at a path, for a reason.
 *
 * @param file The rule's document's path.
 * @param rule The path of the `qti-branch-rule`.
 * @param target Its target.
 * @param reason The reason reading 87 refuses it for.
 * @returns The refusal's facts.
 */
const branchRefused = (file: string, rule: string, target: string, reason: string): Seen => ({
  detail: { reading: "87", reason, target },
  document: fileLocation(location, file),
  location: { kind: "path", path: `${rule}/@target` },
  rule: "branch-target",
});

/**
 * The path of the branch rule the test's item ref `ITEM0` holds.
 */
const item0RulePath =
  "qti-assessment-test/qti-test-part/qti-assessment-section/qti-assessment-item-ref/qti-branch-rule";

/**
 * The part content of a test whose section `OUTER` holds the item ref `ITEMB`, then the section ref
 * `R` that places `S2`, and orders them as given.
 *
 * @param ordering What `OUTER` holds before its parts: a `qti-ordering`, or nothing.
 * @returns The part content.
 */
const outerXml = (ordering: string): string =>
  `<qti-assessment-section identifier="OUTER" title="OUTER" visible="true">${ordering}${itemRefXml("ITEMB", "items/b.xml")}${sectionRefXml("R", "sections/s2.xml")}</qti-assessment-section>`;

/**
 * The files of a package whose test places `S2` through its section ref `R1`, where `S2` holds the
 * item ref `I1` and then the given further section refs, beside a section document `S3` at
 * `sections/s3.xml` that holds the item ref `I3` and then the given section refs.
 *
 * @param fromS2 What `S2` holds after its item ref, as written.
 * @param fromS3 What `S3` holds after its item ref, as written.
 * @returns The package's files.
 */
const loopFiles = (fromS2: string, fromS3: string) =>
  packageOf({
    ...referringFiles(
      settingTotal(oneFloat),
      sectionRefXml("R1", "sections/s2.xml"),
      sectionXml("", fromS2),
    ),
    [manifestFile]: manifestXml(
      resourceXml("T", "imsqti_test_xmlv3p0", "test.xml"),
      resourceXml("I0", "imsqti_item_xmlv3p0", "items/b.xml"),
      resourceXml("I1", "imsqti_item_xmlv3p0", "items/a.xml"),
      resourceXml("S", "imsqti_section_xmlv3p0", "sections/s2.xml"),
      resourceXml("S3", "imsqti_section_xmlv3p0", "sections/s3.xml"),
    ),
    "sections/s3.xml": sectionDocumentXml("S3", `${itemRefXml("I3", "../items/a.xml")}${fromS3}`),
  });

/**
 * Take the facts of every refusal of a package verdict but `missing-attribute`, which the test
 * document's own verdict gives an element that writes no required attribute.
 *
 * @param verdict The package verdict.
 * @returns The other refusals' facts, in order.
 */
const besideMissing = (verdict: PackageVerdict): Seen[] =>
  refusalsOf(verdict).filter(({ rule }) => rule !== "missing-attribute");

/**
 * The `inclusion-cycle` refusal of a section document's one section ref.
 *
 * @param file The section document's path.
 * @param identifier The section ref's identifier.
 * @param href Its `href`.
 * @param chain The chain of documents it returns along.
 * @returns The refusal's facts.
 */
const cycleRefused = (file: string, identifier: string, href: string, chain: string): Seen => ({
  detail: { chain, href, identifier, reading: "85" },
  document: fileLocation(location, file),
  location: { kind: "path", path: "qti-assessment-section/qti-assessment-section-ref" },
  rule: "inclusion-cycle",
});

/**
 * The `package-path-outside` refusal of a section ref whose `href` names no path inside the
 * package (reading 170).
 *
 * @param file The path of the section ref's document.
 * @param at The section ref's path in its document.
 * @param href Its `href`, collapsed.
 * @returns The refusal's facts.
 */
const remoteRefused = (file: string, at: string, href: string): Seen => ({
  detail: { check: "remote-section", href, reading: "170" },
  document: fileLocation(location, file),
  location: { kind: "path", path: at },
  rule: "package-path-outside",
});

/**
 * The path of the section document `S2`'s one item ref, as {@link sectionDocumentXml} writes it.
 */
const sectionItemRef = "qti-assessment-section/qti-assessment-item-ref";

/**
 * Each section document {@link openListing} is given that a judgement of its refs refuses: a label,
 * the section document's text, and the refusals of the package, in order.
 */
const unreachedCases: readonly (readonly [label: string, section: string, refusals: Seen[]])[] = [
  [
    "an external section ref",
    sectionXml("", sectionRefXml("R3", "https://example.com/s.xml")),
    [
      remoteRefused(
        "sections/s2.xml",
        "qti-assessment-section/qti-assessment-section-ref",
        "https://example.com/s.xml",
      ),
    ],
  ],
  [
    "an item ref naming a webcontent file",
    sectionDocumentXml("S2", itemRefXml("I1", "../shared/page.html")),
    [
      {
        detail: { href: "../shared/page.html", identifier: "I1", path: "shared/page.html" },
        document: fileLocation(location, "sections/s2.xml"),
        location: { kind: "path", path: sectionItemRef },
        rule: "item-ref-unresolved",
      },
    ],
  ],
  [
    "an item ref with an external href",
    sectionDocumentXml("S2", itemRefXml("I1", "https://example.com/i.xml")),
    [
      {
        detail: { href: "https://example.com/i.xml", identifier: "I1" },
        document: fileLocation(location, "sections/s2.xml"),
        location: { kind: "path", path: sectionItemRef },
        rule: "item-ref-unresolved",
      },
    ],
  ],
  [
    "a variable mapping from an undeclared source",
    sectionXml('<qti-variable-mapping source-identifier="NOPE" target-identifier="X"/>'),
    [
      atSection("qti-variable-mapping", "source-identifier", {
        attribute: "source-identifier",
        element: "qti-variable-mapping",
        expected: "outcome",
        identifier: "NOPE",
      }),
    ],
  ],
];

/**
 * The path of the section ref the test {@link referringTestXml} writes after its section `SEC`,
 * when it writes one.
 */
const testSectionRefPath = "qti-assessment-test/qti-test-part/qti-assessment-section-ref";

/**
 * The files of a package whose test `T`, {@link referringTestXml}, places `sections/s0.xml` once,
 * where each section document `X<n>`, at `sections/s<n>.xml`, holds one item ref `I<n>` to
 * `items/a.xml` and, but the last, two section refs to the next: so the last is placed
 * `2^(length - 1)` times. The test's outcome processing reads the last item ref's `SCORE`.
 *
 * @param length How many section documents the chain holds.
 * @returns The package's files.
 */
const doublingPackage = (length: number): ReadonlyMap<string, Uint8Array> => {
  const indices = Array.from({ length }, (_, index) => index);

  return packageOf({
    "items/a.xml": reachedItemXml,
    "items/b.xml": otherItemXml,
    [manifestFile]: manifestXml(
      resourceXml("T", "imsqti_test_xmlv3p0", "test.xml"),
      resourceXml("I0", "imsqti_item_xmlv3p0", "items/b.xml"),
      resourceXml("I1", "imsqti_item_xmlv3p0", "items/a.xml"),
      ...indices.map((index) =>
        resourceXml(`S${index}`, "imsqti_section_xmlv3p0", `sections/s${index}.xml`),
      ),
    ),
    ...Object.fromEntries(
      indices.map((index) => [
        `sections/s${index}.xml`,
        sectionDocumentXml(
          `X${index}`,
          `${itemRefXml(`I${index}`, "../items/a.xml")}${index + 1 < length ? `${sectionRefXml(`R${index + 1}A`, `s${index + 1}.xml`)}${sectionRefXml(`R${index + 1}B`, `s${index + 1}.xml`)}` : ""}`,
        ),
      ]),
    ),
    "test.xml": referringTestXml(
      settingTotal(variableXml(`I${length - 1}.SCORE`)),
      sectionRefXml("R0", "sections/s0.xml"),
    ),
  });
};

/**
 * The files of a package whose test `T`, {@link referringTestXml} with no processing, places the
 * section document `S0` at `sections/s0.xml` twice, by `R1` and `R2`, and the given further part
 * content: `S0` holds the item ref `I0`, then the section ref `RU` to `sections/u.xml`, whose
 * section `U` holds the item ref `IU` with a pre-condition over `I0.SCORE`.
 *
 * @param more The test part's content after its two section refs to `S0`, as written.
 * @returns The package's files.
 */
const holdingFiles = (more: string): ReadonlyMap<string, Uint8Array> =>
  packageOf({
    "items/a.xml": reachedItemXml,
    "items/b.xml": otherItemXml,
    [manifestFile]: manifestXml(
      resourceXml("T", "imsqti_test_xmlv3p0", "test.xml"),
      resourceXml("I0", "imsqti_item_xmlv3p0", "items/b.xml"),
      resourceXml("I1", "imsqti_item_xmlv3p0", "items/a.xml"),
      resourceXml("S0", "imsqti_section_xmlv3p0", "sections/s0.xml"),
      resourceXml("U", "imsqti_section_xmlv3p0", "sections/u.xml"),
    ),
    "sections/s0.xml": sectionDocumentXml(
      "S0",
      `${itemRefXml("I0", "../items/a.xml")}${sectionRefXml("RU", "u.xml")}`,
    ),
    "sections/u.xml": sectionDocumentXml(
      "U",
      itemRefXml("IU", "../items/a.xml", preConditionXml(greaterXml("I0.SCORE"))),
    ),
    "test.xml": referringTestXml(
      "",
      `${sectionRefXml("R1", "sections/s0.xml")}${sectionRefXml("R2", "sections/s0.xml")}${more}`,
    ),
  });

/**
 * The namespace of QTI 2.2's usage data, a namespace of QTI 2 (reading 89).
 */
const qti2UsageData = "http://www.imsglobal.org/xsd/imsqti_usagedata_v2p2";

/**
 * Write a usage-data document of one statistic, its root `usageData` in a namespace.
 *
 * @param namespace The root's namespace.
 * @returns The document's text.
 */
const usageDataXml = (namespace: string): string =>
  `<usageData xmlns="${namespace}"><ordinaryStatistic name="P-Value" context="T" caseCount="1"><targetObject identifier="a"/><value>1</value></ordinaryStatistic></usageData>`;

/**
 * A response processing document with no rule, whose root both the response-processing and the
 * response-processing template types name.
 */
const processingXml = `<qti-response-processing xmlns="${qti}"/>`;

/**
 * A LOM record with one title, whose root the metadata type names.
 */
const lomXml = `<lom xmlns="${lomNamespace}"><general>${lomTitle("a")}</general></lom>`;

/**
 * The `resource-type-mismatch` refusal of a resource that names a path two document types name,
 * under a type the path's document is not read as (reading 162).
 *
 * @param position The resource's 1-based position in the manifest.
 * @param type Its declared type.
 * @param file The path it names.
 * @returns The refusal's facts.
 */
const pathTyped = (position: number, type: string, file: string): Seen => ({
  detail: { check: "path-type", path: file, reading: "162", type },
  document: fileLocation(location, manifestFile),
  location: { kind: "path", path: resourceAt(position) },
  rule: "resource-type-mismatch",
});

/**
 * The item ref identifiers a {@link viewingPackage} gives its section documents, each the one
 * before it with `.a` added: `a`, `a.a`, `a.a.a` and so on.
 *
 * @param count How many there are.
 * @returns The identifiers, shortest first.
 */
const dottedPrefixes = (count: number): readonly string[] =>
  Array.from({ length: count }, (_, index) =>
    Array.from({ length: index + 1 }, () => "a").join("."),
  );

/**
 * The files of a package whose test `T`, {@link referringTestXml} with no processing, places
 * `count` section documents `D<n>`, at `sections/d<n>.xml`, each holding one item ref to
 * `items/a.xml` named by {@link dottedPrefixes} and a section ref to `sections/u.xml`. That
 * section, `U`, holds the item ref `IU` with a pre-condition over the longest item ref's `SCORE`,
 * a name each of whose dots splits it at an item ref of another `D<n>`. The test reaches `U`'s one
 * placement through every `D<n>`, so from it each `D<n>` is read both from inside and from outside
 * (reading 86).
 *
 * @param count How many section documents place `U`.
 * @returns The package's files.
 */
const viewingPackage = (count: number): ReadonlyMap<string, Uint8Array> => {
  const prefixes = dottedPrefixes(count);

  return packageOf({
    "items/a.xml": reachedItemXml,
    "items/b.xml": otherItemXml,
    [manifestFile]: manifestXml(
      resourceXml("T", "imsqti_test_xmlv3p0", "test.xml"),
      resourceXml("I0", "imsqti_item_xmlv3p0", "items/b.xml"),
      resourceXml("I1", "imsqti_item_xmlv3p0", "items/a.xml"),
      resourceXml("U", "imsqti_section_xmlv3p0", "sections/u.xml"),
      ...prefixes.map((_, index) =>
        resourceXml(`D${index}`, "imsqti_section_xmlv3p0", `sections/d${index}.xml`),
      ),
    ),
    ...Object.fromEntries(
      prefixes.map((prefix, index) => [
        `sections/d${index}.xml`,
        sectionDocumentXml(
          `D${index}`,
          `${itemRefXml(prefix, "../items/a.xml")}${sectionRefXml(`RU${index}`, "u.xml")}`,
        ),
      ]),
    ),
    "sections/u.xml": sectionDocumentXml(
      "U",
      itemRefXml("IU", "../items/a.xml", preConditionXml(greaterXml(`${prefixes.at(-1)}.SCORE`))),
    ),
    "test.xml": referringTestXml(
      "",
      prefixes.map((_, index) => sectionRefXml(`R${index}`, `sections/d${index}.xml`)).join(""),
    ),
  });
};

/**
 * Open a package holding the item `A` and the resource `UD`, of a type, whose `href` names
 * `usage.xml`, which holds what is given.
 *
 * @param usage The document's text.
 * @param type The resource's type, usage data unless given.
 * @returns The package's verdict.
 */
const openUsageData = (usage: string, type = "qtiusagedata/xml") =>
  openPackage(
    location,
    packageOf({
      "items/a.xml": itemXml("a", "SCORE"),
      [manifestFile]: manifestXml(
        resourceXml("A", "imsqti_item_xmlv3p0", "items/a.xml"),
        resourceXml("UD", type, "usage.xml"),
      ),
      "usage.xml": usage,
    }),
  );

/**
 * The `not-qti-root` refusal of `usage.xml`, whose root is in a namespace of QTI 2 (reading 89).
 *
 * @param element The root's local name.
 * @param namespace Its namespace.
 * @returns The refusal's facts.
 */
const notQti2Root = (element: string, namespace: string): Seen => ({
  detail: { element, namespace, reading: "89" },
  document: fileLocation(location, "usage.xml"),
  location: { kind: "path", path: `{${namespace}}${element}` },
  rule: "not-qti-root",
});

/**
 * Open a package whose resources are the item `A`, then `FIRST` and `SECOND`, each of a type, both
 * naming `doc.xml`.
 *
 * @param first The type of `FIRST`.
 * @param second The type of `SECOND`.
 * @param files The package's other files, `doc.xml` and `items/a.xml` among them.
 * @returns The package's verdict.
 */
const openTwiceNamed = (first: string, second: string, files: Readonly<Record<string, string>>) =>
  openPackage(
    location,
    packageOf({
      ...files,
      [manifestFile]: manifestXml(
        resourceXml("A", "imsqti_item_xmlv3p0", "items/a.xml"),
        resourceXml("FIRST", first, "doc.xml"),
        resourceXml("SECOND", second, "doc.xml"),
      ),
    }),
  );

/**
 * Open a package holding the item `A` and the resource `M`, of a type, whose `href` names the
 * manifest.
 *
 * @param type The type of `M`.
 * @returns The package's verdict.
 */
const openNamingManifest = (type: string) =>
  openPackage(
    location,
    packageOf({
      "items/a.xml": itemXml("a", "SCORE"),
      [manifestFile]: manifestXml(
        resourceXml("A", "imsqti_item_xmlv3p0", "items/a.xml"),
        resourceXml("M", type, manifestFile),
      ),
    }),
  );

/**
 * Write the item `a` whose body holds the given content, after the given head.
 *
 * @param body The content of `qti-item-body`.
 * @param head What comes before the body: declarations, a stylesheet.
 * @returns The item's text.
 */
const bodyItemXml = (body: string, head = ""): string =>
  `<qti-assessment-item xmlns="${qti}" identifier="a" title="a" adaptive="false" time-dependent="false">${head}<qti-item-body>${body}</qti-item-body></qti-assessment-item>`;

/**
 * Open a package whose one resource, the item `A` at `items/a.xml`, lists its document and each
 * further file, which the package holds.
 *
 * @param item The item's text.
 * @param more Each further file's text, keyed by its path.
 * @returns The package's verdict.
 */
const openReferencing = (item: string, more: Readonly<Record<string, string>> = {}) =>
  openPackage(
    location,
    packageOf({
      "items/a.xml": item,
      ...more,
      [manifestFile]: manifestXml(
        `<resource identifier="A" type="imsqti_item_xmlv3p0" href="items/a.xml"><file href="items/a.xml"/>${Object.keys(
          more,
        )
          .map((file) => `<file href="${file}"/>`)
          .join("")}</resource>`,
      ),
    }),
  );

/**
 * The refusal of a file reference that names a file the package neither holds nor lists (E18).
 *
 * @param at The path of the element that holds the reference.
 * @param attribute The attribute that holds it.
 * @param target The path it resolves to.
 * @param document The path of the document that holds it.
 * @returns The refusal's facts.
 */
const missingReference = (
  at: string,
  attribute: string,
  target: string,
  document = "items/a.xml",
): Seen => ({
  detail: { attribute, check: "reference", document, path: target, reading: "103" },
  document: fileLocation(location, document),
  location: { kind: "path", path: `${at}/@${attribute}` },
  rule: "package-file-missing",
});

/**
 * The path of the item `a`'s body, as a refusal inside it is located.
 */
const itemBody = "qti-assessment-item/qti-item-body";

/**
 * The refusal of a file reference an element's text makes that names a file the package neither
 * holds nor lists (R9-b, "Card files and resource icons are file references").
 *
 * @param at The path of the element whose text is the reference.
 * @param element The element's local name, `qti-file-href` or `qti-resource-icon`.
 * @param target The path it resolves to.
 * @param source The line of QTI's information model that settles it.
 * @returns The refusal's facts.
 */
const missingFile = (at: string, element: string, target: string, source: string): Seen => ({
  detail: { check: "reference", document: "items/a.xml", element, path: target, source },
  document: fileLocation(location, "items/a.xml"),
  location: { kind: "path", path: at },
  rule: "package-file-missing",
});

/**
 * The information model's line on a card's files (section 6.6, CardSelection, "these files MUST
 * be contained in the corresponding QTI content package").
 */
const cardFileSource = "info.txt:21151";

/**
 * The information model's line on a resource icon (section 5.80.4, "This file MUST be contained
 * within the correponding QTI content package").
 */
const iconSource = "info.txt:33266";

/**
 * Write the item `a`, whose head holds what is given and whose catalog `c` holds one card.
 *
 * @param card The catalog's card, as written.
 * @param head What the item holds before its body, as written.
 * @returns The item's text.
 */
const cardItemXml = (card: string, head = ""): string =>
  `<qti-assessment-item xmlns="${qti}" identifier="a" title="a" adaptive="false" time-dependent="false">${head}<qti-item-body><p>a</p></qti-item-body><qti-catalog-info><qti-catalog id="c">${card}</qti-catalog></qti-catalog-info></qti-assessment-item>`;

/**
 * Write a card's or card entry's `qti-file-href` of an image.
 *
 * @param href Its text, as written.
 * @returns The element's text.
 */
const cardFileXml = (href: string): string =>
  `<qti-file-href mime-type="image/png">${href}</qti-file-href>`;

/**
 * Write the item `a` whose one card holds one card entry under the given `xml:base`, whose
 * `qti-file-href` names `a.png`.
 *
 * @param base The entry's `xml:base`, as written.
 * @returns The item's text.
 */
const basedCardItemXml = (base: string): string =>
  cardItemXml(
    `<qti-card support="glossary-on-screen"><qti-card-entry xml:base="${base}">${cardFileXml("a.png")}</qti-card-entry></qti-card>`,
  );

/**
 * Write an item's companion materials: a calculator whose information's `qti-file-href` names
 * `calculators/missing.html`, which no package these tests open holds, then one digital material
 * whose `qti-file-href` and `qti-resource-icon` name the given files.
 *
 * @param file The material's `qti-file-href`, as written.
 * @param icon Its `qti-resource-icon`, as written.
 * @returns The companion materials' text.
 */
const materialXml = (file: string, icon: string): string =>
  `<qti-companion-materials-info><qti-calculator><qti-calculator-type>basic</qti-calculator-type><qti-description>A calculator</qti-description><qti-calculator-info><qti-file-href>calculators/missing.html</qti-file-href></qti-calculator-info></qti-calculator><qti-digital-material><qti-file-href>${file}</qti-file-href><qti-resource-icon>${icon}</qti-resource-icon></qti-digital-material></qti-companion-materials-info>`;

/**
 * Write an item whose portable custom interaction's modules name a primary configuration.
 *
 * @param configuration The `primary-configuration`.
 * @returns The item's text.
 */
const configuredItemXml = (configuration: string): string =>
  bodyItemXml(
    `<qti-portable-custom-interaction response-identifier="RESPONSE" module="m" custom-interaction-type-identifier="urn:example:m"><qti-interaction-modules primary-configuration="${configuration}"><qti-interaction-module id="m" primary-path="modules/m"/></qti-interaction-modules><qti-interaction-markup><p>m</p></qti-interaction-markup></qti-portable-custom-interaction>`,
    '<qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="string"/>',
  );

/**
 * Open a package whose test `tests/t.xml` holds one part with the given attributes, whose one
 * section holds the item refs `a` and `b` with the given `href`s, beside the items `A` and `B` at
 * `items/a.xml` and `items/b.xml`.
 *
 * @param part The test part's further attributes, such as an `xml:base`.
 * @param hrefs The `href` of `a`, then of `b`.
 * @param held The items the package holds and lists, by path.
 * @returns The package's verdict.
 */
const openBasedTest = (
  part: string,
  hrefs: readonly [string, string],
  held: readonly string[] = ["items/a.xml", "items/b.xml"],
) =>
  openPackage(
    location,
    packageOf({
      ...Object.fromEntries(held.map((file, index) => [file, itemXml(index === 0 ? "a" : "b")])),
      [manifestFile]: manifestXml(
        resourceXml("T", "imsqti_test_xmlv3p0", "tests/t.xml"),
        ...held.map((file, index) =>
          resourceXml(index === 0 ? "A" : "B", "imsqti_item_xmlv3p0", file),
        ),
      ),
      "tests/t.xml": `<qti-assessment-test xmlns="${qti}" identifier="T" title="T"><qti-test-part identifier="P" navigation-mode="linear" submission-mode="individual"${part}><qti-assessment-section identifier="S" title="S" visible="true"><qti-assessment-item-ref identifier="a" href="${hrefs[0]}"/><qti-assessment-item-ref identifier="b" href="${hrefs[1]}"/></qti-assessment-section></qti-test-part></qti-assessment-test>`,
    }),
  );

/**
 * A hand-built LTI link, a Common Cartridge basic LTI link, which an item ref may name in place of
 * an item (reading 110) and which plate never reads.
 */
const ltiLinkXml =
  '<cartridge_basiclti_link xmlns="http://www.imsglobal.org/xsd/imslticc_v1p0" xmlns:blti="http://www.imsglobal.org/xsd/imsbasiclti_v1p0"><blti:title>Tool</blti:title><blti:launch_url>https://tool.example/launch</blti:launch_url></cartridge_basiclti_link>';

/**
 * A profile version and a resource type of it, the LTI resource a package {@link ltiPackage}
 * builds lists its link under.
 */
type LinkProfile = readonly [version: string, type: string];

/**
 * The LTI resource types of the two profile versions, each under its version: 3.0.0's
 * `imsbasiclti_xmlv1p3`, and 3.0.1's `imslti_xmlv1p1` and `imsltia_xmlv1p0`.
 */
const linkProfiles: readonly LinkProfile[] = [
  ["3.0.0", "imsbasiclti_xmlv1p3"],
  ["3.0.1", "imslti_xmlv1p1"],
  ["3.0.1", "imsltia_xmlv1p0"],
];

/**
 * A package whose test, with a float outcome `TOTAL`, holds the item ref `ITEM1`, to
 * {@link reachedItemXml}, then the item ref `lti`, holding what is given, to an LTI link listed
 * under a resource of a profile's type, with the given outcome processing.
 *
 * @param processing What the test's outcome processing holds, as written.
 * @param ltiRef What the item ref `lti` holds, as written.
 * @param profile The manifest's profile version and the link resource's type.
 * @returns The package's files.
 */
const ltiPackage = (
  processing: string,
  ltiRef = "",
  [version, type]: LinkProfile = ["3.0.1", "imslti_xmlv1p1"],
): ReadonlyMap<string, Uint8Array> =>
  packageOf({
    "items/a.xml": reachedItemXml,
    "links/lti.xml": ltiLinkXml,
    [manifestFile]: manifestXml(
      resourceXml("T", "imsqti_test_xmlv3p0", "test.xml"),
      resourceXml("I1", "imsqti_item_xmlv3p0", "items/a.xml"),
      resourceXml("L", type, "links/lti.xml"),
    ).replace("<schemaversion>3.0.0</schemaversion>", `<schemaversion>${version}</schemaversion>`),
    "test.xml": processingTestXml(
      processing,
      itemRefXml("ITEM1", "items/a.xml"),
      itemRefXml("lti", "links/lti.xml", ltiRef),
    ),
  });

/**
 * The path of {@link ltiPackage}'s item ref `lti`, the test's second.
 */
const ltiRefPath =
  "qti-assessment-test/qti-test-part/qti-assessment-section/qti-assessment-item-ref[2]";

/**
 * Give the `lti-link` marks of a test, each its path.
 *
 * @param test The test.
 * @returns The marks' paths, in order.
 */
const linkMarks = (test: AcceptedTest): readonly string[] =>
  test.unsupported.flatMap(({ feature, path: at }) => (feature === "lti-link" ? [at] : []));

/**
 * The resources each package of the smaller growth check lists, every one naming the same item.
 */
const fewerNamingResources = 2000;

/**
 * The spans the item of the smaller growth check holds. With {@link fewerNamingResources}, a walk
 * of the item's elements for every resource that names it outweighs the rest of opening the
 * package, so 8 times both takes some 45 times as long, while one walk keeps it near 8 times.
 */
const fewerNamingSpans = 4000;

/**
 * The resources the hostile-size case lists, every one naming the same item.
 */
const hostileNamingResources = 2000;

/**
 * The spans the item of the hostile-size case holds.
 */
const hostileNamingSpans = 20_000;

/**
 * The most the hostile-size case's package may take, as a multiple of the thread CPU of the same
 * package with one resource naming its item: a walk of the item for every resource took over 5
 * times as long, and one walk leaves only each resource's own share.
 */
const namingCpuLimit = 2;

/**
 * The growth check opens packages of up to 16,000 resources naming an item of 32,000 spans, three
 * times each. A walk of the item for every resource took over a minute of that, past vitest's
 * default of 5 s, and a failing check should report its ratio, not a timeout.
 */
const growthTimeoutMs = 300_000;

/**
 * Write an item whose identifier and title are `a`, which writes no `xml:lang`, and whose body's
 * one `div` holds a number of spans of one letter each: an element apiece for a walk of its
 * languages to visit, every one stating none.
 *
 * @param spans How many spans the body holds.
 * @returns The item's text.
 */
const spannedItemXml = (spans: number): string =>
  `<qti-assessment-item xmlns="${qti}" identifier="a" title="a" adaptive="false" time-dependent="false"><qti-item-body><div>${"<span>a</span>".repeat(spans)}</div></qti-item-body></qti-assessment-item>`;

/**
 * Write an item resource that names `items/a.xml` and gives no LOM record.
 *
 * @param identifier The resource's identifier.
 * @returns The resource's text.
 */
const bareNamingXml = (identifier: string): string =>
  resourceXml(identifier, "imsqti_item_xmlv3p0", "items/a.xml");

/**
 * Write an item resource that names `items/a.xml` and whose own LOM `general` gives the title `a`,
 * which {@link spannedItemXml}'s item matches, and lists no language, which it needs none of.
 *
 * @param identifier The resource's identifier.
 * @returns The resource's text.
 */
const titledNamingXml = (identifier: string): string =>
  describedXml(identifier, "imsqti_item_xmlv3p0", "items/a.xml", lomTitle("a"));

/**
 * The files of a package of item resources `R<n>` that all name one item, {@link spannedItemXml}'s
 * of a number of spans, at `items/a.xml`.
 *
 * @param resources How many resources name the item.
 * @param spans How many spans its body holds.
 * @param resource Write a resource of an identifier: {@link bareNamingXml} or
 *   {@link titledNamingXml}.
 * @returns The package's files.
 */
const namingPackage = (
  resources: number,
  spans: number,
  resource: (identifier: string) => string,
): ReadonlyMap<string, Uint8Array> =>
  packageOf({
    "items/a.xml": spannedItemXml(spans),
    [manifestFile]: manifestXml(
      ...Array.from({ length: resources }, (_, index) => resource(`R${index}`)),
    ),
  });

/**
 * Report whether a verdict is the refusal of a package whose tests assemble past plate's assembly
 * limit.
 *
 * @param verdict The verdict.
 * @returns Whether it carries an `assembly-limit` refusal.
 */
const pastLimit = (verdict: PackageVerdict): boolean =>
  verdict.verdict === "refused" &&
  verdict.refusals.some((refusal) => refusal.rule === "assembly-limit");

/**
 * Open a package to its end, for a timing that runs the opening as plain code: a package within
 * plate's assembly limit, so that the timing measures its judgement, not the refusal of the limit.
 *
 * @param files The package's files.
 * @returns The opening, which checks only that the package is within the assembly limit.
 */
const opening = (files: ReadonlyMap<string, Uint8Array>) => (): void => {
  assert.isFalse(
    pastLimit(Effect.runSync(openPackage(location, files))),
    "the package's tests assemble past the assembly limit, so the timing would measure no judgement",
  );
};

/**
 * The `a/` segments of the deep `xml:base` in the smaller growth check of a shared base. The
 * brief's 1,000 segments and 200 images took only some 19 times as long on 8 times both when every
 * image copied its base, as the rest of opening the package outweighed the copies; from these sizes
 * a copy for every image takes some 48 times as long, and a shared base some 7.
 */
const fewerBaseSegments = 8000;

/**
 * The images under the deep `xml:base` in the smaller growth check of a shared base.
 */
const fewerBasedImages = 800;

/**
 * The `a/` segments of the deep `xml:base` in the hostile-size case of a shared base, the size the
 * gate's review measured at 3.6 s against 0.19 s.
 */
const hostileBaseSegments = 50_000;

/**
 * The images under the deep `xml:base` in the hostile-size case of a shared base.
 */
const hostileBasedImages = 5000;

/**
 * The most the hostile-size case of a shared base may take, as a multiple of the thread CPU of the
 * same images under an `xml:base` of one segment: a copy of the base for every image took some 19
 * times as long, and a shared base leaves only each image's own share.
 */
const basesCpuLimit = 2;

/**
 * The `a/` segments of the deep `xml:base` whose refusals' verdict must serialise: at this size
 * every image's whole path totalled some 4×10⁹ characters, past the longest string a host can
 * make.
 */
const serialisedBaseSegments = 200_000;

/**
 * The images under the deep `xml:base` whose refusals' verdict must serialise.
 */
const serialisedBasedImages = 10_000;

/**
 * How the images of a deep-base package take their base: all under the one `xml:base`, or each in a
 * `span` that writes an `xml:base` of its own, `b/`, resolved against it.
 */
type Basing = "a base of its own" | "one base";

/**
 * Write the images of a deep-base package, each naming `x.png`, which the package does not hold.
 *
 * @param images How many images there are.
 * @param basing How each takes its base.
 * @returns The images' text.
 */
const basedImagesXml = (images: number, basing: Basing): string =>
  (basing === "one base"
    ? '<img src="x.png" alt=""/>'
    : '<span xml:base="b/"><img src="x.png" alt=""/></span>'
  ).repeat(images);

/**
 * The files of a package whose one item, at `items/a.xml`, holds a `div` that writes an `xml:base`
 * of `a/` a number of times and holds a number of images, each naming `x.png`, which the package
 * does not hold, so each is refused `package-file-missing`.
 *
 * @param segments How many times the `xml:base` writes `a/`.
 * @param images How many images the `div` holds.
 * @param basing How each image takes its base.
 * @returns The package's files.
 */
const deepBasePackage = (
  segments: number,
  images: number,
  basing: Basing = "one base",
): ReadonlyMap<string, Uint8Array> =>
  packageOf({
    "items/a.xml": bodyItemXml(
      `<div xml:base="${"a/".repeat(segments)}"><p>${basedImagesXml(images, basing)}</p></div>`,
    ),
    [manifestFile]: manifestXml(resourceXml("A", "imsqti_item_xmlv3p0", "items/a.xml")),
  });

/**
 * Write the item `a` whose body's one `div` writes an `xml:base` and holds images in a `p`.
 *
 * @param base The `xml:base`, as written.
 * @param sources Each image's `src`, as written.
 * @returns The item's text.
 */
const basedItemXml = (base: string, ...sources: readonly string[]): string =>
  bodyItemXml(
    `<div xml:base="${base}"><p>${sources.map((src) => `<img src="${src}" alt=""/>`).join("")}</p></div>`,
  );

/**
 * The path of an image of {@link basedItemXml}'s item, as a refusal at it is located.
 *
 * @param position The image's 1-based position.
 * @returns Its path.
 */
const basedImageAt = (position: number): string => `${itemBody}/div/p/img[${position}]`;

/**
 * Bound a fact as a refusal's detail bounds it, written out here so the case does not read the code
 * it checks: past 1,024 characters, its first 512 and its last 511 around one `…`.
 *
 * @param fact The fact.
 * @returns The fact, bounded.
 */
const boundedAs = (fact: string): string =>
  fact.length <= 1024 ? fact : `${fact.slice(0, 512)}…${fact.slice(-511)}`;

/**
 * The resources each package of the smaller growth check of a document's root lists, every one
 * naming the same item.
 */
const fewerRootResources = 250;

/**
 * The attributes the item's root writes before its `identifier` and `title` in the smaller growth
 * check of a document's root. With {@link fewerRootResources}, three reads of the root's attributes
 * for every resource that names it took some 40 times as long on 8 times both, and one read some 10.
 */
const fewerRootAttributes = 32_000;

/**
 * The files of a package of item resources `R<n>` that all name one item at `items/a.xml`, each
 * whose own LOM `general` gives the identifier `a` and the title `a`, which the item matches, and
 * whose root writes a number of `data-` attributes before its `identifier` and `title` and no
 * `xml:lang`, so each read of one of them passes every attribute.
 *
 * @param resources How many resources name the item.
 * @param attributes How many `data-` attributes its root writes.
 * @returns The package's files.
 */
const rootPackage = (resources: number, attributes: number): ReadonlyMap<string, Uint8Array> =>
  packageOf({
    "items/a.xml": `<qti-assessment-item xmlns="${qti}"${Array.from({ length: attributes }, (_, index) => ` data-a${index}="a"`).join("")} identifier="a" title="a" adaptive="false" time-dependent="false"><qti-item-body><p>a</p></qti-item-body></qti-assessment-item>`,
    [manifestFile]: manifestXml(
      ...Array.from({ length: resources }, (_, index) =>
        describedXml(
          `R${index}`,
          "imsqti_item_xmlv3p0",
          "items/a.xml",
          `${lomIdentifiers("a")}${lomTitle("a")}`,
        ),
      ),
    ),
  });

/**
 * The parts placing one section document, and the pre-conditions of its one item ref, in the
 * smaller growth check of a section document many parts place.
 */
const fewerPlacingParts = 20;

/**
 * The parts placing one section document, and the pre-conditions of its one item ref, in the
 * hostile-size case, the size the gate's review measured at 7.5 s against 0.12 s. Its 640
 * placements of the document pass plate's assembly limit of 4 MiB placed, so it is refused.
 */
const hostilePlacingParts = 640;

/**
 * How a package's section refs to one section document are placed: each in a test part of its
 * own, so each places the document under its own part, or all in one part, so they place it once
 * under that part.
 */
type Placing = "a part each" | "one part";

/**
 * Write a linear test part of individual submission.
 *
 * @param identifier The part's identifier.
 * @param content What it holds, as written.
 * @returns The part's text.
 */
const partXml = (identifier: string, content: string): string =>
  `<qti-test-part identifier="${identifier}" navigation-mode="linear" submission-mode="individual">${content}</qti-test-part>`;

/**
 * The files of a package whose test `T` holds a part `P` whose section `SEC` holds the item ref
 * `ITEM0`, to `items/b.xml` ({@link otherItemXml}), then a number of section refs to the section
 * document `S2` at `sections/s2.xml`, whose one item ref `I1` holds as many pre-conditions, each
 * over `ITEM0.N`, a dotted reading through the test's own item ref.
 *
 * @param refs How many section refs place `S2`, and how many pre-conditions `I1` holds.
 * @param placing How the section refs are placed.
 * @returns The package's files.
 */
const placingPackage = (refs: number, placing: Placing): ReadonlyMap<string, Uint8Array> => {
  const sectionRefs = Array.from({ length: refs }, (_, index) =>
    sectionRefXml(`R${index}`, "sections/s2.xml"),
  );

  return packageOf({
    "items/b.xml": otherItemXml,
    [manifestFile]: manifestXml(
      resourceXml("T", "imsqti_test_xmlv3p0", "test.xml"),
      resourceXml("I0", "imsqti_item_xmlv3p0", "items/b.xml"),
      resourceXml("S", "imsqti_section_xmlv3p0", "sections/s2.xml"),
    ),
    "sections/s2.xml": sectionDocumentXml(
      "S2",
      itemRefXml(
        "I1",
        "../items/b.xml",
        Array.from({ length: refs }, () => preConditionXml(greaterXml("ITEM0.N"))).join(""),
      ),
    ),
    "test.xml": `<qti-assessment-test xmlns="${qti}" identifier="T" title="T">${partXml("P", `<qti-assessment-section identifier="SEC" title="SEC" visible="true">${itemRefXml("ITEM0", "items/b.xml")}</qti-assessment-section>`)}${placing === "one part" ? partXml("Q", sectionRefs.join("")) : sectionRefs.map((ref, index) => partXml(`Q${index}`, ref)).join("")}</qti-assessment-test>`,
  });
};

/**
 * Write the test `T` of one part `P`, whose `xml:base` is given, holding one section `S` of item
 * refs `I1`, `I2` and so on, each naming a given `href`.
 *
 * @param base The part's `xml:base`, as written.
 * @param hrefs Each item ref's `href`, as written.
 * @returns The test's text.
 */
const basedRefsTestXml = (base: string, hrefs: readonly string[]): string =>
  `<qti-assessment-test xmlns="${qti}" identifier="T" title="T"><qti-test-part identifier="P" navigation-mode="linear" submission-mode="individual" xml:base="${base}"><qti-assessment-section identifier="S" title="S" visible="true">${hrefs.map((href, index) => itemRefXml(`I${index + 1}`, href)).join("")}</qti-assessment-section></qti-test-part></qti-assessment-test>`;

/**
 * The `a/` segments of the deep `xml:base` in the smaller growth check of item refs under a deep
 * base.
 */
const fewerRefSegments = 8000;

/**
 * The item refs under the deep `xml:base` in the smaller growth check of item refs under a deep
 * base.
 */
const fewerBasedRefs = 800;

/**
 * The `a/` segments of the deep `xml:base` whose item refs' verdict must serialise: at this size
 * every item ref's whole path totalled some 4×10⁹ characters, past the longest string a host can
 * make.
 */
const serialisedRefSegments = 200_000;

/**
 * The item refs under the deep `xml:base` whose verdict must serialise.
 */
const serialisedBasedRefs = 10_000;

/**
 * What the item refs under a deep `xml:base` name: an item the manifest lists at that path, or no
 * document the manifest lists.
 */
type RefNaming = "a listed item" | "no listed document";

/**
 * The files of a package whose test `tests/t.xml` holds one part whose `xml:base` writes `a/` a
 * number of times, and whose one section holds a number of item refs `I<n>`, each naming `x.xml`
 * under it: the item `x`, which the package holds and lists there, or nothing it lists, so each is
 * refused `item-ref-unresolved`.
 *
 * @param segments How many times the `xml:base` writes `a/`.
 * @param refs How many item refs the section holds.
 * @param naming What each names.
 * @returns The package's files.
 */
const deepRefsPackage = (
  segments: number,
  refs: number,
  naming: RefNaming,
): ReadonlyMap<string, Uint8Array> => {
  const itemPath = `tests/${"a/".repeat(segments)}x.xml`;
  const listed = naming === "a listed item";

  return packageOf(
    Object.fromEntries([
      ...(listed ? [[itemPath, itemXml("x")] as const] : []),
      [
        manifestFile,
        manifestXml(
          resourceXml("T", "imsqti_test_xmlv3p0", "tests/t.xml"),
          ...(listed ? [resourceXml("X", "imsqti_item_xmlv3p0", itemPath)] : []),
        ),
      ] as const,
      [
        "tests/t.xml",
        basedRefsTestXml(
          "a/".repeat(segments),
          Array.from({ length: refs }, () => "x.xml"),
        ),
      ] as const,
    ]),
  );
};

/**
 * The path of an item ref of {@link basedRefsTestXml}'s test, as a refusal at it is located.
 *
 * @param position The item ref's 1-based position.
 * @returns Its path.
 */
const basedRefAt = (position: number): string =>
  `qti-assessment-test/qti-test-part/qti-assessment-section/qti-assessment-item-ref[${position}]`;

/**
 * The `item-ref-unresolved` refusal of an item ref of {@link basedRefsTestXml}'s test, at
 * `tests/t.xml`, that names no document the manifest lists.
 *
 * @param position The item ref's 1-based position.
 * @param href Its `href`.
 * @param named The path it names, as the refusal gives it.
 * @returns The refusal's facts.
 */
const unresolvedBasedRef = (position: number, href: string, named: string): Seen => ({
  detail: { href, identifier: `I${position}`, path: named },
  document: fileLocation(location, "tests/t.xml"),
  location: { kind: "path", path: basedRefAt(position) },
  rule: "item-ref-unresolved",
});

/**
 * Open a package of the test of {@link basedRefsTestXml} under a base, beside the item `x` at
 * `held.xml` under it, which the manifest lists, and give its `item-ref-unresolved` refusals.
 *
 * @param base The part's `xml:base`.
 * @param hrefs Each item ref's `href`.
 * @returns The `item-ref-unresolved` refusals.
 */
const unresolvedUnder = (base: string, hrefs: readonly string[]) =>
  Effect.map(
    openPackage(
      location,
      packageOf({
        [`tests/${base}held.xml`]: itemXml("x"),
        [manifestFile]: manifestXml(
          resourceXml("T", "imsqti_test_xmlv3p0", "tests/t.xml"),
          resourceXml("X", "imsqti_item_xmlv3p0", `tests/${base}held.xml`),
        ),
        "tests/t.xml": basedRefsTestXml(base, hrefs),
      }),
    ),
    (verdict) => refusedUnder(verdict, "item-ref-unresolved"),
  );

/**
 * The section documents of the smaller growth check of refusals many placements give, each
 * writing the section identifier `X`. From the brief's 250 a count of every refusal given so far at
 * each placement took only some 34 times as long on 8 times as many, as the rest of opening the
 * package outweighed the counts; from 500 it takes some 50 times as long. It is 256, as eight times
 * as many, 2,048, are the most plate's assembly limit admits, so the larger check still judges
 * its package.
 */
const fewerRepeatingDocuments = 256;

/**
 * The files of a package whose test `T` holds one part `P` of section refs `R<n>`, each placing a
 * section document of its own, `sections/s<n>.xml`, whose one section writes the identifier `X` and
 * holds nothing: every one after the first gives `X` again, so each is refused
 * `duplicate-identifier`.
 *
 * @param documents How many section documents the test places.
 * @returns The package's files.
 */
const repeatingPackage = (documents: number): ReadonlyMap<string, Uint8Array> => {
  const indices = Array.from({ length: documents }, (_, index) => index);

  return packageOf({
    [manifestFile]: manifestXml(
      resourceXml("T", "imsqti_test_xmlv3p0", "test.xml"),
      ...indices.map((index) =>
        resourceXml(`S${index}`, "imsqti_section_xmlv3p0", `sections/s${index}.xml`),
      ),
    ),
    ...Object.fromEntries(
      indices.map((index) => [`sections/s${index}.xml`, sectionDocumentXml("X", "")]),
    ),
    "test.xml": `<qti-assessment-test xmlns="${qti}" identifier="T" title="T">${partXml("P", indices.map((index) => sectionRefXml(`R${index}`, `sections/s${index}.xml`)).join(""))}</qti-assessment-test>`,
  });
};

/**
 * The section documents of the hostile-size case of inclusion cycles, the size the gate's review
 * measured at 8.8 s of CPU and 260 MB.
 */
const hostileCyclingDocuments = 100;

/**
 * The section refs back to the first section document that each section document of the hostile
 * cycle case holds.
 */
const cyclingRefsBack = 20;

/**
 * The directory, some 1,000 characters deep, that holds the section documents of the hostile cycle
 * case, so each path a chain names is that long.
 */
const cyclingDirectory = "d/".repeat(500);

/**
 * The path of a section document of {@link cyclingPackage}.
 *
 * @param index The document's 0-based position in the chain.
 * @returns Its path.
 */
const cyclingAt = (index: number): string => `${cyclingDirectory}s${index}.xml`;

/**
 * The files of a package whose test `T`, at `test.xml`, places a chain of section documents in
 * {@link cyclingDirectory}: its one part's section ref names the first, and each section document
 * `X<n>` ({@link cyclingAt}) holds one item ref `I<n>` to `items/a.xml` ({@link reachedItemXml}),
 * then {@link cyclingRefsBack} section refs `B<n>_<k>` back to `s0.xml`, the first, each refused
 * `inclusion-cycle`, and, but the last, a section ref `R<n + 1>` to the next.
 *
 * @param documents How many section documents the chain holds.
 * @returns The package's files.
 */
const cyclingPackage = (documents: number): ReadonlyMap<string, Uint8Array> => {
  const indices = Array.from({ length: documents }, (_, index) => index);
  const backRefs = (index: number): string =>
    Array.from({ length: cyclingRefsBack }, (_, back) =>
      sectionRefXml(`B${index}_${back}`, "s0.xml"),
    ).join("");

  return packageOf({
    "items/a.xml": reachedItemXml,
    [manifestFile]: manifestXml(
      resourceXml("T", "imsqti_test_xmlv3p0", "test.xml"),
      resourceXml("I1", "imsqti_item_xmlv3p0", "items/a.xml"),
      ...indices.map((index) =>
        resourceXml(`S${index}`, "imsqti_section_xmlv3p0", cyclingAt(index)),
      ),
    ),
    ...Object.fromEntries(
      indices.map((index) => [
        cyclingAt(index),
        sectionDocumentXml(
          `X${index}`,
          `${itemRefXml(`I${index}`, `${"../".repeat(500)}items/a.xml`)}${backRefs(index)}${index + 1 < documents ? sectionRefXml(`R${index + 1}`, `s${index + 1}.xml`) : ""}`,
        ),
      ]),
    ),
    "test.xml": `<qti-assessment-test xmlns="${qti}" identifier="T" title="T">${partXml("P", sectionRefXml("R0", cyclingAt(0)))}</qti-assessment-test>`,
  });
};

/**
 * The whole chain of an `inclusion-cycle` refusal of a section ref of {@link cyclingPackage} back
 * to the first section document: the test, every section document from the first down to the one
 * that holds the ref, then the first again.
 *
 * @param index The 0-based position of the document that holds the ref.
 * @returns The chain, before any bound.
 */
const cyclingChain = (index: number): string =>
  [
    "test.xml",
    ...Array.from({ length: index + 1 }, (_, above) => cyclingAt(above)),
    cyclingAt(0),
  ].join(" ");

/**
 * The section documents, and the item refs whose branch rule targets `X`, of the smaller growth
 * check of branch rules whose target many documents write.
 */
const fewerBranchingDocuments = 125;

/**
 * The section documents, and the item refs whose branch rule targets `X`, of the hostile-size
 * case of branch rules whose target many documents write, the size the gate's review measured at
 * 16.7 s against 0.54 s with `X` written once.
 */
const hostileBranchingDocuments = 2000;

/**
 * The most the hostile-size case of branch rules whose target many documents write may take, as a
 * multiple of the thread CPU of the same package with the target written once: a scan of every
 * placement and every writer for each rule took many times as long, and indexing them once leaves
 * only each rule's own share.
 */
const branchingCpuLimit = 2;

/**
 * Which section documents of {@link branchingPackage} write the section identifier `X`: every one,
 * so every one after the first gives it again, or the first alone, the others writing `X<n>`.
 */
type Writing = "every document" | "the first document";

/**
 * The files of a package whose test `T` holds one part `P` whose section `SEC` holds item refs
 * `r<n>` to `items/a.xml` ({@link reachedItemXml}), each with a branch rule to `X`, then section
 * refs `R<n>`, each placing a section document of its own, `sections/s<n>.xml`, whose one section
 * holds nothing. A branch rule's target never lies inside a section document a ref places (reading
 * 87), so each rule is refused `branch-target`: `ambiguous` when every document writes `X`, as the
 * test places them all, and `unknown` when only the first does.
 *
 * @param documents How many section documents the test places, and how many item refs it holds.
 * @param writing Which section documents write `X`.
 * @returns The package's files.
 */
const branchingPackage = (documents: number, writing: Writing): ReadonlyMap<string, Uint8Array> => {
  const indices = Array.from({ length: documents }, (_, index) => index);
  const writes = (index: number): string =>
    writing === "every document" || index === 0 ? "X" : `X${index}`;
  const rules = indices
    .map((index) => itemRefXml(`r${index}`, "items/a.xml", branchRuleXml("X")))
    .join("");
  const refs = indices
    .map((index) => sectionRefXml(`R${index}`, `sections/s${index}.xml`))
    .join("");

  return packageOf({
    "items/a.xml": reachedItemXml,
    [manifestFile]: manifestXml(
      resourceXml("T", "imsqti_test_xmlv3p0", "test.xml"),
      resourceXml("I", "imsqti_item_xmlv3p0", "items/a.xml"),
      ...indices.map((index) =>
        resourceXml(`S${index}`, "imsqti_section_xmlv3p0", `sections/s${index}.xml`),
      ),
    ),
    ...Object.fromEntries(
      indices.map((index) => [`sections/s${index}.xml`, sectionDocumentXml(writes(index), "")]),
    ),
    "test.xml": `<qti-assessment-test xmlns="${qti}" identifier="T" title="T">${partXml("P", `<qti-assessment-section identifier="SEC" title="SEC" visible="true">${rules}</qti-assessment-section>${refs}`)}</qti-assessment-test>`,
  });
};

/**
 * The refusals of a package of {@link branchingPackage}: each branch rule `branch-target` at the
 * test, at its item ref's position, for a reason, then, when every document writes `X`, each
 * document after the first `duplicate-identifier`.
 *
 * @param documents How many section documents and item refs it holds.
 * @param writing Which section documents write `X`.
 * @returns The refusals' facts, in order.
 */
const branchingRefusals = (documents: number, writing: Writing): readonly Seen[] => [
  ...Array.from({ length: documents }, (_, index) =>
    branchRefused(
      "test.xml",
      `qti-assessment-test/qti-test-part/qti-assessment-section/qti-assessment-item-ref[${index + 1}]/qti-branch-rule`,
      "X",
      writing === "every document" ? "ambiguous" : "unknown",
    ),
  ),
  ...(writing === "every document"
    ? Array.from({ length: documents - 1 }, (_, index) =>
        duplicateIn(`sections/s${index + 1}.xml`, "qti-assessment-section", "X"),
      )
    : []),
];

/**
 * The section documents, each writing a target of its own, and the branch rules of the smaller
 * growth check of rules whose distinct targets each document writes its own of. Eight times as
 * many, each placed 16 times, are the most within plate's assembly limit of 2,048 placements, so
 * the larger check still judges its package.
 */
const fewerTargetDocuments = 15;

/**
 * The section documents, each writing a target of its own, and the branch rules of the hostile-size
 * case of rules whose distinct targets each document writes its own of, placed some 16,000 times,
 * past plate's assembly limit of 2,048 placements, so it is refused. Placed by one part, some 2,000
 * times, it opens within the limit.
 */
const hostileTargetDocuments = 1000;

/**
 * The test parts of {@link targetsPackage}, each placing the hub that places every section
 * document twice, so each document has 16 placements. A walk of every placement for each target
 * then made opening the package at 2,000 section documents take some 10 to 13 times the thread CPU
 * of one target for all, and some 39 to 48 times as long on 8 times the documents; with each
 * document placed once, those walks cost less than the rest of opening it, some 1.7 times one
 * target's at 2,000 section documents.
 */
const targetParts = 8;

/**
 * Which identifier each branch rule of {@link targetsPackage} targets: `X<n>`, the one the `n`th
 * section document writes, or `X0`, the first's, for all.
 */
type Targets = "each its own" | "one";

/**
 * Where the branch rules of {@link targetsPackage} lie: in the test, which no section document lies
 * above, or in the section document `sections/r.xml` that every section document places, so each
 * target's writers lie above the rules.
 */
type RulesIn = "the test" | "a section document";

/**
 * The item refs `r<n>`, each with a branch rule to its target, of {@link targetsPackage}.
 *
 * @param documents How many there are.
 * @param targets Which identifier each targets.
 * @param href The item's `href` from the document that holds them.
 * @returns Their text.
 */
const targetRulesXml = (documents: number, targets: Targets, href: string): string =>
  Array.from({ length: documents }, (_, index) =>
    itemRefXml(`r${index}`, href, branchRuleXml(targets === "one" ? "X0" : `X${index}`)),
  ).join("");

/**
 * The files of a package whose test `T` holds test parts, {@link targetParts} unless given, each
 * placing the section document `sections/h.xml`, whose section `SA` draws its order (`qti-ordering
 * shuffle="true"`) and whose section `SB` does not, each holding a section ref to each section
 * document `sections/s<n>.xml`, which writes `X<n>`. So each section document is placed twice under
 * each part, once under a drawn order and once not. Each of the item refs `r<n>` to `items/a.xml`
 * ({@link reachedItemXml}) holds a branch rule to its target; they lie in the first part's section
 * `SEC`, or in `sections/r.xml`, which each section document places.
 *
 * A target's document is placed more than once, so where the test reaches the rule's placement
 * through none of its placements the rule is refused `branch-target` `ambiguous` (reading 87): in
 * the test, which no section document lies above, and in `sections/r.xml`, which the test reaches
 * through the other section documents. There a target also lies in a document above, in the
 * section that holds the section ref the rule's placement descends through, so it is `backward`
 * too.
 *
 * @param documents How many section documents and branch rules it holds.
 * @param targets Which identifier each rule targets.
 * @param rulesIn Where the rules lie.
 * @param placing How many test parts place the hub, {@link targetParts} unless given.
 * @returns The package's files.
 */
const targetsPackage = (
  documents: number,
  targets: Targets,
  rulesIn: RulesIn,
  placing = targetParts,
): ReadonlyMap<string, Uint8Array> => {
  const indices = Array.from({ length: documents }, (_, index) => index);
  const refsFrom = (prefix: string): string =>
    indices.map((index) => sectionRefXml(`${prefix}${index}`, `s${index}.xml`)).join("");
  const placesRules = rulesIn === "a section document";
  const parts = Array.from({ length: placing }, (_, part) =>
    partXml(
      `P${part}`,
      `${part === 0 && !placesRules ? `<qti-assessment-section identifier="SEC" title="SEC" visible="true">${targetRulesXml(documents, targets, "items/a.xml")}</qti-assessment-section>` : ""}${sectionRefXml(`H${part}`, "sections/h.xml")}`,
    ),
  ).join("");

  const files = {
    "items/a.xml": reachedItemXml,
    [manifestFile]: manifestXml(
      resourceXml("T", "imsqti_test_xmlv3p0", "test.xml"),
      resourceXml("I", "imsqti_item_xmlv3p0", "items/a.xml"),
      resourceXml("H", "imsqti_section_xmlv3p0", "sections/h.xml"),
      ...(placesRules ? [resourceXml("RS", "imsqti_section_xmlv3p0", "sections/r.xml")] : []),
      ...indices.map((index) =>
        resourceXml(`S${index}`, "imsqti_section_xmlv3p0", `sections/s${index}.xml`),
      ),
    ),
    ...Object.fromEntries(
      indices.map((index) => [
        `sections/s${index}.xml`,
        sectionDocumentXml(`X${index}`, placesRules ? sectionRefXml(`RR${index}`, "r.xml") : ""),
      ]),
    ),
    "sections/h.xml": sectionDocumentXml(
      "H",
      `<qti-assessment-section identifier="SA" title="SA" visible="true"><qti-ordering shuffle="true"/>${refsFrom("A")}</qti-assessment-section><qti-assessment-section identifier="SB" title="SB" visible="true">${refsFrom("B")}</qti-assessment-section>`,
    ),
    "test.xml": `<qti-assessment-test xmlns="${qti}" identifier="T" title="T">${parts}</qti-assessment-test>`,
  };

  return packageOf(
    placesRules
      ? {
          ...files,
          "sections/r.xml": sectionDocumentXml(
            "RS",
            targetRulesXml(documents, targets, "../items/a.xml"),
          ),
        }
      : files,
  );
};

/**
 * The refusals of a package of {@link targetsPackage}: each branch rule `branch-target`
 * `ambiguous`, and, in `sections/r.xml`, `backward` too.
 *
 * @param documents How many section documents and branch rules it holds.
 * @param targets Which identifier each rule targets.
 * @param rulesIn Where the rules lie.
 * @returns The refusals' facts, in order.
 */
const targetsRefusals = (documents: number, targets: Targets, rulesIn: RulesIn): readonly Seen[] =>
  Array.from({ length: documents }, (_, index) => {
    const target = targets === "one" ? "X0" : `X${index}`;

    return rulesIn === "the test"
      ? [
          branchRefused(
            "test.xml",
            `qti-assessment-test/qti-test-part[1]/qti-assessment-section/qti-assessment-item-ref[${index + 1}]/qti-branch-rule`,
            target,
            "ambiguous",
          ),
        ]
      : ["ambiguous", "backward"].map((reason) =>
          branchRefused(
            "sections/r.xml",
            `qti-assessment-section/qti-assessment-item-ref[${index + 1}]/qti-branch-rule`,
            target,
            reason,
          ),
        );
  }).flat();

/**
 * The test parts of {@link hubPackage}, each placing the hub that places every section document,
 * so each document has as many placements, one under each part.
 */
const hubParts = 64;

/**
 * The test parts of the growth check of {@link hubPackage}: under {@link hubParts}, eight times
 * {@link fewerHubDocuments} would pass plate's assembly limit of 2,048 placements, and the larger
 * check would judge nothing; under 2, the larger one places 2,002.
 */
const hubGrowthParts = 2;

/**
 * The section documents, and the reads through them, of the smaller growth check of a test that
 * reads through every document a hub places.
 */
const fewerHubDocuments = 125;

/**
 * The section documents, and the reads through them, of the hostile-size case of a test that reads
 * through every document a hub places, some 940 KB, the size the gate's re-review measured at 18.0
 * s and 5.4 GB of heap against 0.88 s for the same package reading the test's own outcome, past
 * the default heap. Under {@link hubParts} it places 128,064 placements, past plate's assembly
 * limit of 2,048, so it is refused.
 */
const hostileHubDocuments = 2000;

/**
 * What the outcome processing of {@link hubPackage} sums, once for each section document:
 * `I<n>.N`, through the item ref of the `n`th document, or the test's own `TOTAL`.
 */
type HubReads = "each document's item" | "the test's own";

/**
 * The files of a package whose test `T` declares `TOTAL` and holds test parts `P<p>`,
 * {@link hubParts} unless given, each placing the section document `sections/h.xml` through a
 * section ref of its own. Its section `HUB` places the section documents `sections/s<n>.xml`, each
 * of whose sections `X<n>` holds the item ref `I<n>` to `items/b.xml` ({@link otherItemXml}), so
 * each is placed once under each part. The test's outcome processing sets `TOTAL` to a sum of one
 * read for each document.
 *
 * @param documents How many section documents the hub places.
 * @param reads What each read of the sum reads.
 * @param placing How many test parts place the hub, {@link hubParts} unless given.
 * @returns The package's files.
 */
const hubPackage = (
  documents: number,
  reads: HubReads,
  placing = hubParts,
): ReadonlyMap<string, Uint8Array> => {
  const indices = Array.from({ length: documents }, (_, index) => index);
  const sum = indices
    .map((index) => variableXml(reads === "the test's own" ? "TOTAL" : `I${index}.N`))
    .join("");
  const parts = Array.from({ length: placing }, (_, part) =>
    partXml(`P${part}`, sectionRefXml(`H${part}`, "sections/h.xml")),
  ).join("");

  return packageOf({
    "items/b.xml": otherItemXml,
    [manifestFile]: manifestXml(
      resourceXml("T", "imsqti_test_xmlv3p0", "test.xml"),
      resourceXml("I", "imsqti_item_xmlv3p0", "items/b.xml"),
      resourceXml("H", "imsqti_section_xmlv3p0", "sections/h.xml"),
      ...indices.map((index) =>
        resourceXml(`S${index}`, "imsqti_section_xmlv3p0", `sections/s${index}.xml`),
      ),
    ),
    "sections/h.xml": sectionDocumentXml(
      "HUB",
      indices.map((index) => sectionRefXml(`R${index}`, `s${index}.xml`)).join(""),
    ),
    ...Object.fromEntries(
      indices.map((index) => [
        `sections/s${index}.xml`,
        sectionDocumentXml(`X${index}`, itemRefXml(`I${index}`, "../items/b.xml")),
      ]),
    ),
    "test.xml": `<qti-assessment-test xmlns="${qti}" identifier="T" title="T"><qti-outcome-declaration identifier="TOTAL" cardinality="single" base-type="float"/>${parts}<qti-outcome-processing><qti-set-outcome-value identifier="TOTAL"><qti-sum>${sum}</qti-sum></qti-set-outcome-value></qti-outcome-processing></qti-assessment-test>`,
  });
};

/**
 * The refusals of a package of {@link hubPackage} that reads each document's item: each read
 * `ambiguous-reference` at the test, as the test reads each document from outside it and every
 * part places it (reading 86).
 *
 * @param documents How many section documents the hub places.
 * @returns The refusals' facts, in order.
 */
const hubRefusals = (documents: number): readonly Seen[] =>
  Array.from({ length: documents }, (_, index) => ({
    detail: {
      firstPrefix: `I${index}`,
      firstVariable: "N",
      reading: "86",
      reference: `I${index}.N`,
      secondPrefix: `I${index}`,
      secondVariable: "N",
    },
    document: fileLocation(location, "test.xml"),
    location: {
      kind: "path",
      path: `qti-assessment-test/qti-outcome-processing/qti-set-outcome-value/qti-sum/qti-variable[${index + 1}]/@identifier`,
    },
    rule: "ambiguous-reference",
  }));

/**
 * The files of a package whose test `T` places the section document `S0` at `sections/s0.xml`
 * twice in its part `P`, once in the section `SA`, which draws its order, and once in `SB`, which
 * does not, so under two contexts. `S0` holds the item ref `I0` to `items/a.xml` and a section ref
 * to `U` at `sections/u.xml`, whose item ref's pre-condition reads `I0.SCORE`, so both placements
 * of `S0` place the one placement of `U`, which more section refs of the part may place too.
 *
 * @param more What the part holds after `SA` and `SB`, as written.
 * @returns The package's files.
 */
const aroundFiles = (more: string): ReadonlyMap<string, Uint8Array> =>
  packageOf({
    "items/a.xml": reachedItemXml,
    "items/b.xml": otherItemXml,
    [manifestFile]: manifestXml(
      resourceXml("T", "imsqti_test_xmlv3p0", "test.xml"),
      resourceXml("I0", "imsqti_item_xmlv3p0", "items/b.xml"),
      resourceXml("I1", "imsqti_item_xmlv3p0", "items/a.xml"),
      resourceXml("S0", "imsqti_section_xmlv3p0", "sections/s0.xml"),
      resourceXml("U", "imsqti_section_xmlv3p0", "sections/u.xml"),
    ),
    "sections/s0.xml": sectionDocumentXml(
      "S0",
      `${itemRefXml("I0", "../items/a.xml")}${sectionRefXml("RU", "u.xml")}`,
    ),
    "sections/u.xml": sectionDocumentXml(
      "U",
      itemRefXml("IU", "../items/a.xml", preConditionXml(greaterXml("I0.SCORE"))),
    ),
    "test.xml": referringTestXml(
      "",
      `<qti-assessment-section identifier="SA" title="SA" visible="true"><qti-ordering shuffle="true"/>${sectionRefXml("R1", "sections/s0.xml")}</qti-assessment-section><qti-assessment-section identifier="SB" title="SB" visible="true">${sectionRefXml("R2", "sections/s0.xml")}</qti-assessment-section>${more}`,
    ),
  });

/**
 * The section documents `sections/c<n>.xml` of {@link layeredPackage}, each placing the next, the
 * last placing `sections/r.xml`: more than the 64 section refs a walk up from `r`'s placement once
 * read before it gave up and walked every placement for each target instead.
 */
const layeredChain = 70;

/**
 * The test parts of the growth check of {@link layeredPackage}, each placing the hub, so each of
 * the hub's documents has as many placements. Under 64, eight times {@link fewerLayered} would
 * pass plate's assembly limit of 2,048 placements, and the larger check would judge nothing; under
 * 2, the larger one places 1,995.
 */
const layeredParts = 2;

/**
 * The branch rules, and the section documents the hub places, of the smaller growth check of
 * {@link layeredPackage}.
 */
const fewerLayered = 120;

/**
 * The branch rules of the hostile-size case of {@link layeredPackage}: with
 * {@link hostileLayeredParts} and {@link hostileLayeredDocuments}, some 0.9 MB, the shape the gate's
 * re-review measured at 16.9 s and 5.4 GB of heap against 0.86 s with every rule to `X0`, past the
 * default heap. It places some 128,000 placements, past plate's assembly limit of 2,048, so it is
 * refused.
 */
const hostileLayeredTargets = 2000;

/**
 * The test parts of the hostile-size case of {@link layeredPackage}, each placing the hub.
 */
const hostileLayeredParts = 128;

/**
 * The section documents the hub places in the hostile-size case of {@link layeredPackage}.
 */
const hostileLayeredDocuments = 1000;

/**
 * Which identifier each branch rule of {@link layeredPackage} targets: `X<n>`, its own, or `X0`
 * for all.
 */
type Aimed = "each its own" | "one";

/**
 * The files of a package whose test `T` holds the test part `P0`, whose section `S0` places the
 * section document `sections/a.xml` twice, in its section `SA` and in `SB`, which draws its order,
 * then holds what is given, and further test parts `Q<p>`, each placing the hub `sections/h.xml`,
 * whose section `H` places the section documents `sections/k<n>.xml`, each holding one item ref.
 * `a` holds the item refs `X<n>` to `items/b.xml` ({@link otherItemXml}), so it writes every
 * target, and places `sections/c1.xml`, which leads through {@link layeredChain} section documents
 * to `sections/r.xml`, whose one item ref `r0` holds a branch rule to each target. So two writers'
 * placements lie above `r`'s, neither on every way down to it, and a walk up from it reads every
 * document of the chain before it settles.
 *
 * @param targets How many targets `a` writes, and how many branch rules `r0` holds.
 * @param aimed Which identifier each rule targets.
 * @param parts How many test parts place the hub.
 * @param documents How many section documents the hub places.
 * @param more What `S0` holds after `SA` and `SB`, as written.
 * @returns The package's files.
 */
const layeredPackage = (
  targets: number,
  aimed: Aimed,
  parts: number,
  documents: number,
  more = "",
): ReadonlyMap<string, Uint8Array> => {
  const written = Array.from({ length: targets }, (_, index) => index);
  const placed = Array.from({ length: documents }, (_, index) => index);
  const chain = Array.from({ length: layeredChain }, (_, index) => index + 1);
  const rules = written.map((index) => branchRuleXml(aimed === "one" ? "X0" : `X${index}`));
  const hubbed = Array.from({ length: parts }, (_, part) =>
    partXml(`Q${part}`, sectionRefXml(`H${part}`, "sections/h.xml")),
  ).join("");

  return packageOf({
    "items/b.xml": otherItemXml,
    [manifestFile]: manifestXml(
      resourceXml("T", "imsqti_test_xmlv3p0", "test.xml"),
      resourceXml("I", "imsqti_item_xmlv3p0", "items/b.xml"),
      resourceXml("A", "imsqti_section_xmlv3p0", "sections/a.xml"),
      ...chain.map((index) =>
        resourceXml(`C${index}`, "imsqti_section_xmlv3p0", `sections/c${index}.xml`),
      ),
      resourceXml("R", "imsqti_section_xmlv3p0", "sections/r.xml"),
      resourceXml("H", "imsqti_section_xmlv3p0", "sections/h.xml"),
      ...placed.map((index) =>
        resourceXml(`K${index}`, "imsqti_section_xmlv3p0", `sections/k${index}.xml`),
      ),
    ),
    "sections/a.xml": sectionDocumentXml(
      "A",
      `${written.map((index) => itemRefXml(`X${index}`, "../items/b.xml")).join("")}${sectionRefXml("RC", "c1.xml")}`,
    ),
    ...Object.fromEntries(
      chain.map((index) => [
        `sections/c${index}.xml`,
        sectionDocumentXml(
          `C${index}`,
          index < layeredChain
            ? sectionRefXml(`RC${index}`, `c${index + 1}.xml`)
            : sectionRefXml("RR", "r.xml"),
        ),
      ]),
    ),
    "sections/h.xml": sectionDocumentXml(
      "H",
      placed.map((index) => sectionRefXml(`HR${index}`, `k${index}.xml`)).join(""),
    ),
    ...Object.fromEntries(
      placed.map((index) => [
        `sections/k${index}.xml`,
        sectionDocumentXml(`K${index}`, itemRefXml(`KI${index}`, "../items/b.xml")),
      ]),
    ),
    "sections/r.xml": sectionDocumentXml("R", itemRefXml("r0", "../items/b.xml", rules.join(""))),
    "test.xml": `<qti-assessment-test xmlns="${qti}" identifier="T" title="T">${partXml("P0", `<qti-assessment-section identifier="S0" title="S0" visible="true"><qti-assessment-section identifier="SA" title="SA" visible="true">${sectionRefXml("RA1", "sections/a.xml")}</qti-assessment-section><qti-assessment-section identifier="SB" title="SB" visible="true"><qti-ordering shuffle="true"/>${sectionRefXml("RA2", "sections/a.xml")}</qti-assessment-section>${more}</qti-assessment-section>`)}${hubbed}</qti-assessment-test>`,
  });
};

/**
 * The refusals of a package of {@link layeredPackage}: each branch rule `branch-target` at
 * `sections/r.xml`, once for each reason given, in order.
 *
 * @param targets How many branch rules it holds, at least 2.
 * @param aimed Which identifier each rule targets.
 * @param reasons The reasons each rule is refused for.
 * @returns The refusals' facts, in order.
 */
const layeredRefusals = (
  targets: number,
  aimed: Aimed,
  reasons: readonly string[],
): readonly Seen[] =>
  Array.from({ length: targets }, (_, index) =>
    reasons.map((reason) =>
      branchRefused(
        "sections/r.xml",
        `qti-assessment-section/qti-assessment-item-ref/qti-branch-rule[${index + 1}]`,
        aimed === "one" ? "X0" : `X${index}`,
        reason,
      ),
    ),
  ).flat();

/**
 * The most thread CPU, in milliseconds, opening a package one step past plate's assembly limit may
 * take: the walk stops at the placement that passes the bound and no test is judged, so refusing
 * costs what reading the package and reaching the bound do.
 */
const pastLimitMs = 100;

/**
 * The most thread CPU, in milliseconds, opening a package at the largest size plate's assembly
 * limit admits may take: within the limit, judging the assembled tests costs seconds at most.
 */
const withinLimitMs = 2000;

/**
 * The most the heap may grow by while a package at the largest size the assembly limit admits
 * opens, in bytes.
 */
const withinLimitHeap = 512 * 2 ** 20;

/**
 * The `assembly-limit` refusal of a package whose tests assemble past a bound, at the package.
 *
 * @param bound The bound passed.
 * @param reached The count that passed it.
 * @returns The refusal's facts.
 */
const limitRefused = (bound: "bytes" | "placements", reached: string): Seen => ({
  detail: { bound, limit: bound === "bytes" ? "4194304" : "2048", reached },
  document: location,
  location: { kind: "document" },
  rule: "assembly-limit",
});

/**
 * Take the facts of every refusal the documents' own verdicts give a package, in the order of its
 * resources: those a package past the assembly limit still gives beside the limit's, as no test
 * is judged.
 *
 * @param verdict The package verdict.
 * @returns The refusals' facts.
 */
const documentRefusals = (verdict: PackageVerdict): readonly Seen[] =>
  verdict.resources.flatMap((resource) =>
    Option.match(resource.verdict, {
      onNone: () => [],
      onSome: (judged) =>
        judged.verdict === "refused" ? judged.refusals.map((refusal) => seen(refusal)) : [],
    }),
  );

/**
 * Open a package one step past the assembly limit and check that it is refused `assembly-limit`
 * alone, but for the documents' own refusals, and fast: the thread CPU of the fastest of
 * {@link growthRuns} openings is under a limit.
 *
 * @param files The package's files.
 * @param refused The facts the `assembly-limit` refusal carries.
 * @param limitMs The most thread CPU the opening may take, in milliseconds.
 * @returns Nothing; the test fails when the package is refused otherwise, or slowly.
 */
const refusedFast = (files: ReadonlyMap<string, Uint8Array>, refused: Seen, limitMs: number) =>
  Effect.gen(function* limitRefusedFast() {
    const verdict = yield* openPackage(location, files);
    assert.deepStrictEqual(refusalsOf(verdict), [refused, ...documentRefusals(verdict)]);

    let fastest = Number.POSITIVE_INFINITY;
    for (let run = 0; run < growthRuns; run += 1) {
      fastest = Math.min(
        fastest,
        yield* cpuMillis(() => {
          Effect.runSync(openPackage(location, files));
        }),
      );
    }

    assert.isBelow(fastest, limitMs, `the refusal took ${fastest.toFixed(0)} ms of thread CPU`);
  });

/**
 * What the section documents of {@link ladderPackage}'s bottom read: `I<n>.N` through every rung's
 * item ref, summed in one pre-condition, or a branch rule to each rung's item ref.
 */
type LadderReads = "a branch rule to each" | "every rung's item";

/**
 * The files of a package (N2, re-review `4cbe3e85`) whose test `T` holds test parts `P<p>`, each
 * placing the section document `sections/d0.xml`, the top of a ladder of rungs `d<n>`: each holds
 * the item ref `I<n>` to `items/b.xml` ({@link otherItemXml}), a section `Q<n>` and a section
 * `M<n>` that draws its order, each with a section ref to the next rung, the last to
 * `sections/bottom.xml`. So each rung below the top has two placements under each part, and the
 * bottom's item ref `IB` reads through every rung.
 *
 * @param parts How many test parts place the ladder.
 * @param rungs How many rungs it has.
 * @param reads What the bottom reads.
 * @returns The package's files.
 */
const ladderPackage = (
  parts: number,
  rungs: number,
  reads: LadderReads,
): ReadonlyMap<string, Uint8Array> => {
  const indices = Array.from({ length: rungs }, (_, index) => index);
  const bottom =
    reads === "a branch rule to each"
      ? indices.map((index) => branchRuleXml(`I${index}`)).join("")
      : preConditionXml(
          `<qti-gt><qti-sum>${indices.map((index) => variableXml(`I${index}.N`)).join("")}</qti-sum>${oneFloat}</qti-gt>`,
        );

  return packageOf({
    "items/b.xml": otherItemXml,
    [manifestFile]: manifestXml(
      resourceXml("T", "imsqti_test_xmlv3p0", "test.xml"),
      resourceXml("I", "imsqti_item_xmlv3p0", "items/b.xml"),
      ...indices.map((index) =>
        resourceXml(`S${index}`, "imsqti_section_xmlv3p0", `sections/d${index}.xml`),
      ),
      resourceXml("SB", "imsqti_section_xmlv3p0", "sections/bottom.xml"),
    ),
    "sections/bottom.xml": sectionDocumentXml("B", itemRefXml("IB", "../items/b.xml", bottom)),
    ...Object.fromEntries(
      indices.map((index) => {
        const next = index + 1 < rungs ? `d${index + 1}.xml` : "bottom.xml";

        return [
          `sections/d${index}.xml`,
          sectionDocumentXml(
            `D${index}`,
            `${itemRefXml(`I${index}`, "../items/b.xml")}<qti-assessment-section identifier="Q${index}" title="Q" visible="true">${sectionRefXml(`RQ${index}`, next)}</qti-assessment-section><qti-assessment-section identifier="M${index}" title="M" visible="true"><qti-ordering shuffle="true"/>${sectionRefXml(`RM${index}`, next)}</qti-assessment-section>`,
          ),
        ];
      }),
    ),
    "test.xml": `<qti-assessment-test xmlns="${qti}" identifier="T" title="T">${Array.from(
      { length: parts },
      (_, part) => partXml(`P${part}`, sectionRefXml(`H${part}`, "sections/d0.xml")),
    ).join("")}</qti-assessment-test>`,
  });
};

/**
 * What each section document of {@link chainedPartsPackage} reads: the next document's `I<n>.N` in
 * a pre-condition, or a branch rule to `I0`.
 */
type ChainReads = "a branch rule to the first" | "the next document's item";

/**
 * The files of a package (N3, re-review `4cbe3e85`) whose test `T` holds test parts `P<p>`, each
 * placing the head of a chain of section documents `sections/s<n>.xml`, each placing the next. Each
 * holds the item ref `I<n>` to `items/b.xml` ({@link otherItemXml}), whose pre-condition reads
 * through another document's item ref or which holds a branch rule, so every placement reads the
 * placements above it.
 *
 * @param parts How many test parts place the chain.
 * @param length How many section documents it holds.
 * @param reads What each document reads.
 * @returns The package's files.
 */
const chainedPartsPackage = (
  parts: number,
  length: number,
  reads: ChainReads,
): ReadonlyMap<string, Uint8Array> => {
  const indices = Array.from({ length }, (_, index) => index);

  return packageOf({
    "items/b.xml": otherItemXml,
    [manifestFile]: manifestXml(
      resourceXml("T", "imsqti_test_xmlv3p0", "test.xml"),
      resourceXml("I", "imsqti_item_xmlv3p0", "items/b.xml"),
      ...indices.map((index) =>
        resourceXml(`S${index}`, "imsqti_section_xmlv3p0", `sections/s${index}.xml`),
      ),
    ),
    ...Object.fromEntries(
      indices.map((index) => [
        `sections/s${index}.xml`,
        sectionDocumentXml(
          `X${index}`,
          `${itemRefXml(
            `I${index}`,
            "../items/b.xml",
            reads === "a branch rule to the first"
              ? branchRuleXml("I0")
              : preConditionXml(greaterXml(`I${(index + 1) % length}.N`)),
          )}${index + 1 < length ? sectionRefXml(`R${index + 1}`, `s${index + 1}.xml`) : ""}`,
        ),
      ]),
    ),
    "test.xml": `<qti-assessment-test xmlns="${qti}" identifier="T" title="T">${Array.from(
      { length: parts },
      (_, part) => partXml(`P${part}`, sectionRefXml(`H${part}`, "sections/s0.xml")),
    ).join("")}</qti-assessment-test>`,
  });
};

/**
 * What places the hub of {@link readingHubPackage}: test parts of one test, or tests of their own.
 */
type HubPlacers = "parts" | "tests";

/**
 * The files of a package (N4 and N5, re-review `4cbe3e85` and head-cto `c2106c85`) that places
 * the hub `sections/h.xml` a number of times: through test parts `P<p>` of the test `T`, or through
 * tests `t<n>.xml` of their own. The hub places the section documents `sections/s<n>.xml`, each
 * holding the item ref `I<n>` to `items/b.xml` ({@link otherItemXml}), and its own item ref `HI`
 * reads `I<n>.N` through every one of them in a pre-condition.
 *
 * @param placedBy What places the hub.
 * @param placings How many parts or tests place it.
 * @param documents How many section documents the hub places.
 * @returns The package's files.
 */
const readingHubPackage = (
  placedBy: HubPlacers,
  placings: number,
  documents: number,
): ReadonlyMap<string, Uint8Array> => {
  const indices = Array.from({ length: documents }, (_, index) => index);
  const placers = Array.from({ length: placings }, (_, index) => index);
  const read = preConditionXml(
    `<qti-gt><qti-sum>${indices.map((index) => variableXml(`I${index}.N`)).join("")}</qti-sum>${oneFloat}</qti-gt>`,
  );
  const tests =
    placedBy === "parts"
      ? {
          "test.xml": `<qti-assessment-test xmlns="${qti}" identifier="T" title="T">${placers
            .map((part) => partXml(`P${part}`, sectionRefXml(`H${part}`, "sections/h.xml")))
            .join("")}</qti-assessment-test>`,
        }
      : Object.fromEntries(
          placers.map((test) => [
            `t${test}.xml`,
            `<qti-assessment-test xmlns="${qti}" identifier="T${test}" title="T">${partXml("P", sectionRefXml("H", "sections/h.xml"))}</qti-assessment-test>`,
          ]),
        );

  return packageOf({
    "items/b.xml": otherItemXml,
    [manifestFile]: manifestXml(
      ...(placedBy === "parts"
        ? [resourceXml("T", "imsqti_test_xmlv3p0", "test.xml")]
        : placers.map((test) => resourceXml(`T${test}`, "imsqti_test_xmlv3p0", `t${test}.xml`))),
      resourceXml("I", "imsqti_item_xmlv3p0", "items/b.xml"),
      resourceXml("H", "imsqti_section_xmlv3p0", "sections/h.xml"),
      ...indices.map((index) =>
        resourceXml(`S${index}`, "imsqti_section_xmlv3p0", `sections/s${index}.xml`),
      ),
    ),
    "sections/h.xml": sectionDocumentXml(
      "HUB",
      `${itemRefXml("HI", "../items/b.xml", read)}${indices.map((index) => sectionRefXml(`R${index}`, `s${index}.xml`)).join("")}`,
    ),
    ...Object.fromEntries(
      indices.map((index) => [
        `sections/s${index}.xml`,
        sectionDocumentXml(`X${index}`, itemRefXml(`I${index}`, "../items/b.xml")),
      ]),
    ),
    ...tests,
  });
};

/**
 * The files of a package (N6, head-cto `c2106c85`) whose tests `t<n>.xml` each place one large
 * section document `sections/s.xml`, of item refs `I<n>` to `items/b.xml` ({@link otherItemXml}),
 * each with a pre-condition over its own `I<n>.N`. Each test judges the document again, so the
 * work follows the bytes the tests place, however few placements there are.
 *
 * @param tests How many tests place the document.
 * @param refs How many item refs it holds.
 * @returns The package's files.
 */
const largeDocumentPackage = (tests: number, refs: number): ReadonlyMap<string, Uint8Array> => {
  const placers = Array.from({ length: tests }, (_, index) => index);

  return packageOf({
    "items/b.xml": otherItemXml,
    [manifestFile]: manifestXml(
      ...placers.map((test) => resourceXml(`T${test}`, "imsqti_test_xmlv3p0", `t${test}.xml`)),
      resourceXml("I", "imsqti_item_xmlv3p0", "items/b.xml"),
      resourceXml("S", "imsqti_section_xmlv3p0", "sections/s.xml"),
    ),
    "sections/s.xml": sectionDocumentXml(
      "S",
      Array.from({ length: refs }, (_, index) =>
        itemRefXml(`I${index}`, "../items/b.xml", preConditionXml(greaterXml(`I${index}.N`))),
      ).join(""),
    ),
    ...Object.fromEntries(
      placers.map((test) => [
        `t${test}.xml`,
        `<qti-assessment-test xmlns="${qti}" identifier="T${test}" title="T">${partXml("P", sectionRefXml("H", "sections/s.xml"))}</qti-assessment-test>`,
      ]),
    ),
  });
};

/**
 * The bytes a package's tests place when they first pass the byte bound, placing a section
 * document of a size over and over: the count stops at that placement.
 *
 * @param size The section document's size, in bytes.
 * @returns The count reached, as the refusal's detail writes it.
 */
const bytesReached = (size: number): string => String((Math.floor(4_194_304 / size) + 1) * size);

/**
 * The files of a package with two tests, `t1.xml` and `t2.xml`, each of whose 16 test parts places
 * the hub `sections/h.xml`, which places 63 section documents `sections/s<n>.xml` of one item ref
 * each: 1,024 placements apiece, 2,048 in all, the most plate's assembly limit admits. With one
 * more, `t2.xml` holds a 17th part placing `sections/e.xml`, the 2,049th.
 *
 * @param more Whether `t2.xml` places one section document more.
 * @param order Which test the manifest lists first: `t1.xml`, or `t2.xml`.
 * @returns The package's files.
 */
const twoTestsPackage = (
  more: boolean,
  order: "first" | "second",
): ReadonlyMap<string, Uint8Array> => {
  const indices = Array.from({ length: 63 }, (_, index) => index);
  const hubbed = Array.from({ length: 16 }, (_, part) =>
    partXml(`P${part}`, sectionRefXml(`H${part}`, "sections/h.xml")),
  ).join("");
  const tests = [
    resourceXml("T1", "imsqti_test_xmlv3p0", "t1.xml"),
    resourceXml("T2", "imsqti_test_xmlv3p0", "t2.xml"),
  ];

  return packageOf({
    "items/b.xml": otherItemXml,
    [manifestFile]: manifestXml(
      ...(order === "first" ? tests : tests.toReversed()),
      resourceXml("I", "imsqti_item_xmlv3p0", "items/b.xml"),
      resourceXml("H", "imsqti_section_xmlv3p0", "sections/h.xml"),
      resourceXml("E", "imsqti_section_xmlv3p0", "sections/e.xml"),
      ...indices.map((index) =>
        resourceXml(`S${index}`, "imsqti_section_xmlv3p0", `sections/s${index}.xml`),
      ),
    ),
    "sections/e.xml": sectionDocumentXml("E", itemRefXml("IE", "../items/b.xml")),
    "sections/h.xml": sectionDocumentXml(
      "HUB",
      indices.map((index) => sectionRefXml(`R${index}`, `s${index}.xml`)).join(""),
    ),
    ...Object.fromEntries(
      indices.map((index) => [
        `sections/s${index}.xml`,
        sectionDocumentXml(`X${index}`, itemRefXml(`I${index}`, "../items/b.xml")),
      ]),
    ),
    "t1.xml": `<qti-assessment-test xmlns="${qti}" identifier="T1" title="T">${hubbed}</qti-assessment-test>`,
    "t2.xml": `<qti-assessment-test xmlns="${qti}" identifier="T2" title="T">${hubbed}${more ? partXml("PE", sectionRefXml("HE", "sections/e.xml")) : ""}</qti-assessment-test>`,
  });
};

/**
 * The files of a package whose test `T` holds 256 test parts, each placing the section document
 * `sections/s.xml`, which holds one item ref and an XML comment that makes it exactly a size: at
 * 16,384 bytes, the parts place 4 MiB, the most plate's assembly limit admits.
 *
 * @param size The section document's size, in bytes.
 * @returns The package's files.
 */
const sizedPackage = (size: number): ReadonlyMap<string, Uint8Array> => {
  const unpadded = sectionDocumentXml("S", `${itemRefXml("I0", "../items/b.xml")}<!---->`);

  return packageOf({
    "items/b.xml": otherItemXml,
    [manifestFile]: manifestXml(
      resourceXml("T", "imsqti_test_xmlv3p0", "test.xml"),
      resourceXml("I", "imsqti_item_xmlv3p0", "items/b.xml"),
      resourceXml("S", "imsqti_section_xmlv3p0", "sections/s.xml"),
    ),
    "sections/s.xml": sectionDocumentXml(
      "S",
      `${itemRefXml("I0", "../items/b.xml")}<!--${"x".repeat(size - unpadded.length)}-->`,
    ),
    "test.xml": `<qti-assessment-test xmlns="${qti}" identifier="T" title="T">${Array.from(
      { length: 256 },
      (_, part) => partXml(`P${part}`, sectionRefXml(`H${part}`, "sections/s.xml")),
    ).join("")}</qti-assessment-test>`,
  });
};

/**
 * One member of the family of shapes whose assembled tests grow faster than the package (head-cto
 * `c2106c85`, the re-reviews `d7b4f8de` and `4cbe3e85`), each with a package one step past the
 * bound it passes and one at the largest size the bounds admit.
 */
interface FamilyMember {
  /**
   * The package at the largest size the bounds admit, built when the case runs.
   */
  readonly at: () => ReadonlyMap<string, Uint8Array>;
  /**
   * The bound the package one step past passes.
   */
  readonly bound: "bytes" | "placements";
  readonly id: string;
  readonly name: string;
  /**
   * The package one step past the bound, built when the case runs.
   */
  readonly past: () => ReadonlyMap<string, Uint8Array>;
}

/**
 * The family, each one step past its bound on the axis that passes it, where reading the package
 * is cheap (64 parts or tests), and at the largest size the bounds admit where its cost was worst.
 */
const familyMembers: readonly FamilyMember[] = [
  {
    at: () => hubPackage(1023, "each document's item", 2),
    bound: "placements",
    id: "F17-A",
    name: "a hub under parts, read by the test",
    past: () => hubPackage(32, "each document's item", 64),
  },
  {
    at: () => layeredPackage(2000, "each its own", 1, 1974),
    bound: "placements",
    id: "F17-B",
    name: "branch rules below a long chain",
    past: () => layeredPackage(128, "each its own", 64, 30),
  },
  {
    at: () => ladderPackage(1, 1023, "every rung's item"),
    bound: "placements",
    id: "N2 bottom",
    name: "a ladder read at its bottom",
    past: () => ladderPackage(64, 16, "every rung's item"),
  },
  {
    at: () => ladderPackage(1, 1023, "a branch rule to each"),
    bound: "placements",
    id: "N2 branch",
    name: "a ladder branching at its bottom",
    past: () => ladderPackage(64, 16, "a branch rule to each"),
  },
  {
    at: () => chainedPartsPackage(1, 2048, "the next document's item"),
    bound: "placements",
    id: "N3 pre",
    name: "a chain under parts, read through",
    past: () => chainedPartsPackage(64, 33, "the next document's item"),
  },
  {
    at: () => chainedPartsPackage(1, 2048, "a branch rule to the first"),
    bound: "placements",
    id: "N3 branch",
    name: "a chain under parts, branching",
    past: () => chainedPartsPackage(64, 33, "a branch rule to the first"),
  },
  {
    at: () => readingHubPackage("parts", 2, 1023),
    bound: "placements",
    id: "N4",
    name: "a hub under parts, reading its own",
    past: () => readingHubPackage("parts", 64, 32),
  },
  {
    at: () => readingHubPackage("tests", 2, 1023),
    bound: "placements",
    id: "N5",
    name: "a hub under tests, reading its own",
    past: () => readingHubPackage("tests", 64, 32),
  },
  {
    at: () => largeDocumentPackage(8, 2230),
    bound: "bytes",
    id: "N6",
    name: "tests placing one large document",
    past: () => largeDocumentPackage(64, 281),
  },
];

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
      { tags: ["corpus"] },
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
      { tags: ["corpus"] },
    );

    it.effect(
      "refuses a hand-built item declared imsqti_test_xmlv3p0 as resource-type-mismatch",
      () =>
        Effect.gen(function* itemAsTest() {
          const verdict = yield* openPackage(
            location,
            packageOf({
              "items/a.xml": itemXml("a", "SCORE"),
              [manifestFile]: manifestXml(resourceXml("A", "imsqti_test_xmlv3p0", "items/a.xml")),
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
            "items/a.xml": itemXml("a", "SCORE"),
            "items/b.xml": `<qti-assessment-item xmlns="${qti}" identifier="b" adaptive="false" time-dependent="false"><qti-item-body><p>b</p></qti-item-body></qti-assessment-item>`,
            [manifestFile]: manifestXml(
              resourceXml("A", "imsqti_item_xmlv3p0", "items/a.xml"),
              resourceXml("B", "imsqti_item_xmlv3p0", "items/b.xml"),
            ),
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
      `refuses a.b.SCORE as ambiguous-reference when item refs a and a.b both resolve it (reading 48 ("a dotted reference is accepted when exactly one reading names a real item ref, test part or section and its variable"))`,
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

    it.effect(
      `accepts a.b.SCORE when only item ref a.b resolves it (reading 48 ("a dotted reference is accepted when exactly one reading names a real item ref, test part or section and its variable"))`,
      () =>
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
      `align-54 prefixed references D6: counts the numbered form under a selection with replacement, the built-ins and a section's duration among a reference's readings, and the numbered form nowhere else (reading 48 ("a dotted reference is accepted when exactly one reading names a real item ref, test part or section and its variable"); reading 88 ("a numbered reference such as Q01.2.SCORE names an instance of an item ref that a selection with replacement can repeat, and nothing else"))`,
      () =>
        Effect.gen(function* forms() {
          assert.deepStrictEqual(
            readings(yield* openPackage(location, formsPackage("a.2.SCORE", replacingSelection))),
            [["a", "2.SCORE", "a.2", "SCORE"]],
          );
          assert.deepStrictEqual(
            readings(
              yield* openPackage(location, formsPackage("a.2.duration", replacingSelection)),
            ),
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
          acceptedOf(yield* openPackage(location, formsPackage("a.2.SCORE")));
          acceptedOf(yield* openPackage(location, formsPackage("a.2.duration")));
        }),
    );

    it.effect(
      `[T-9] refuses ITEM1.SCORE as undeclared-variable when no reading resolves it, pantry's prefixed-ref (reading 48 ("a dotted reference is accepted when exactly one reading names a real item ref, test part or section and its variable"))`,
      () =>
        Effect.gen(function* unresolvedReading() {
          const verdict = yield* openPackage(location, readingThroughA("ITEM1.SCORE"));

          assert.deepStrictEqual(refusalsOf(verdict), [
            {
              detail: {
                check: "reading",
                element: "qti-variable",
                identifier: "ITEM1.SCORE",
                reading: "48",
              },
              document: fileLocation(location, "test.xml"),
              location: { kind: "path", path: `${expressionAt("qti-variable")}/@identifier` },
              rule: "undeclared-variable",
            },
          ]);
        }),
    );

    it.effect(
      'align-54 prefixed references D6: a numbered reading counts only under a selection with replacement: a.1.SCORE is refused as undeclared-variable with check numbered when none holds item ref a, and accepted when one does, in the test or above the section ref that places a section document holding the item ref; a.0.SCORE names no instance and keeps its reading refusal (reading 88 ("a numbered reference such as Q01.2.SCORE names an instance of an item ref that a selection with replacement can repeat, and nothing else"))',
      () =>
        Effect.gen(function* numberedReadings() {
          assert.deepStrictEqual(
            refusalsOf(yield* openPackage(location, readingThroughA("a.1.SCORE"))),
            [
              {
                detail: {
                  check: "numbered",
                  element: "qti-variable",
                  identifier: "a.1.SCORE",
                  itemRef: "a",
                  reading: "88",
                  reference: "a.1.SCORE",
                },
                document: fileLocation(location, "test.xml"),
                location: { kind: "path", path: `${expressionAt("qti-variable")}/@identifier` },
                rule: "undeclared-variable",
              },
            ],
          );
          assert.deepStrictEqual(
            refusalsOf(yield* openPackage(location, readingThroughA("a.0.SCORE"))).map(
              (refusal) => [refusal.rule, refusal.detail["check"]],
            ),
            [["undeclared-variable", "reading"]],
          );
          acceptedOf(
            yield* openPackage(
              location,
              readingPackage(
                readingTestXml(
                  variableXml("a.1.SCORE"),
                  "",
                  replacingSelection,
                  itemRefXml("a", "items/a.xml"),
                ),
                { "items/a.xml": itemXml("a", "SCORE") },
              ),
            ),
          );

          const reaching = (sectionRefs: string) =>
            openPackage(
              location,
              packageOf(
                referringFiles(settingTotal(variableXml("I1.1.SCORE")), sectionRefs, sectionXml()),
              ),
            );
          acceptedOf(
            yield* reaching(
              `<qti-assessment-section identifier="OUTER" title="OUTER" visible="true">${replacingSelection}${sectionRefXml("R", "sections/s2.xml")}</qti-assessment-section>`,
            ),
          );
          assert.deepStrictEqual(
            refusalsOf(yield* reaching(sectionRefXml("R", "sections/s2.xml"))).map(
              ({ detail, rule }) => [rule, detail["check"], detail["itemRef"]],
            ),
            [["undeclared-variable", "numbered", "I1"]],
          );
        }),
    );

    it.effect(
      `[T-9] refuses a dotted name in qti-index's n that no reading resolves, as one in identifier is (reading 48 ("a dotted reference is accepted when exactly one reading names a real item ref, test part or section and its variable"))`,
      () =>
        Effect.gen(function* unresolvedAttribute() {
          const verdict = yield* openPackage(
            location,
            readingPackage(
              readingTestXml(
                '<qti-index n="ITEM1.N"><qti-variable identifier="LIST"/></qti-index>',
                '<qti-outcome-declaration identifier="LIST" cardinality="ordered" base-type="float"/>',
                itemRefXml("a", "items/a.xml"),
              ),
              { "items/a.xml": itemXml("a", "SCORE") },
            ),
          );

          assert.deepStrictEqual(refusalsOf(verdict), [
            {
              detail: {
                attribute: "n",
                check: "reading",
                element: "qti-index",
                identifier: "ITEM1.N",
                reading: "48",
              },
              document: fileLocation(location, "test.xml"),
              location: { kind: "path", path: `${expressionAt("qti-index")}/@n` },
              rule: "undeclared-variable",
            },
          ]);
        }),
    );

    it.effect(
      "[T-9] accepts S.TOTAL, a name the test declared whole, with no item ref, part or section S (reading 37)",
      () =>
        Effect.gen(function* declaredWhole() {
          acceptedOf(
            yield* openPackage(
              location,
              readingPackage(
                readingTestXml(
                  '<qti-variable identifier="S.TOTAL"/>',
                  '<qti-outcome-declaration identifier="S.TOTAL" cardinality="single" base-type="float"/>',
                  itemRefXml("a", "items/a.xml"),
                ),
                { "items/a.xml": itemXml("a", "SCORE") },
              ),
            ),
          );
        }),
    );

    it.effect(
      'align-54 prefixed references D6: refuses a.b, which the test declares, as ambiguous-reference beside item ref a whose item declares b, the unsplit reading first with an empty prefix (reading 48 ("the unsplit reading counts among them"))',
      () =>
        Effect.gen(function* unsplitReading() {
          const verdict = yield* openPackage(
            location,
            readingPackage(
              readingTestXml(
                variableXml("a.b"),
                '<qti-outcome-declaration identifier="a.b" cardinality="single" base-type="float"/>',
                itemRefXml("a", "items/a.xml"),
              ),
              { "items/a.xml": itemXml("a", "b") },
            ),
          );

          assert.deepStrictEqual(refusalsOf(verdict), [
            {
              detail: {
                firstPrefix: "",
                firstVariable: "a.b",
                reading: "48",
                reference: "a.b",
                secondPrefix: "a",
                secondVariable: "b",
              },
              document: fileLocation(location, "test.xml"),
              location: { kind: "path", path: `${expressionAt("qti-variable")}/@identifier` },
              rule: "ambiguous-reference",
            },
          ]);
          assert.isTrue(acceptedAlone(verdict), "the test alone is accepted");
        }),
    );

    it.effect(
      'align-54 prefixed references D6: refuses A.B.C declared whole beside item refs A and A.B whose items would each resolve it, as ambiguous-reference between the unsplit reading and the first split (reading 48 ("the unsplit reading counts among them"))',
      () =>
        Effect.gen(function* declaredWholeBesideReadings() {
          assert.deepStrictEqual(
            readings(
              yield* openPackage(
                location,
                readingPackage(
                  readingTestXml(
                    '<qti-variable identifier="A.B.C"/>',
                    '<qti-outcome-declaration identifier="A.B.C" cardinality="single" base-type="float"/>',
                    itemRefXml("A", "items/a.xml"),
                    itemRefXml("A.B", "items/ab.xml"),
                  ),
                  { "items/a.xml": itemXml("a", "B.C"), "items/ab.xml": itemXml("ab", "C") },
                ),
              ),
            ),
            [["", "A.B.C", "A", "B.C"]],
          );
        }),
    );

    it.effect(
      "[T-9] align-54 untimed duration D7: accepts ITEM1.duration whether ITEM1's item is time dependent or not (reading 150, \"an item's built-in `duration` may be read whether or not the item is time dependent\")",
      () =>
        Effect.gen(function* untimed() {
          for (const timeDependent of ["false", "true"]) {
            acceptedOf(
              yield* openPackage(
                location,
                readingPackage(
                  readingTestXml(
                    '<qti-variable identifier="ITEM1.duration"/>',
                    "",
                    itemRefXml("ITEM1", "items/a.xml"),
                  ),
                  {
                    "items/a.xml": itemXml("a", "SCORE").replace(
                      'time-dependent="false"',
                      `time-dependent="${timeDependent}"`,
                    ),
                  },
                ),
              ),
            );
          }
        }),
    );

    it.effect(
      "[T-9] accepts ITEM1.T where ITEM1 maps its item's SCORE to T, as pantry resolves a mapping target before a declaration (D9)",
      () =>
        Effect.gen(function* mappedTarget() {
          acceptedOf(
            yield* openPackage(
              location,
              readingPackage(
                readingTestXml(
                  '<qti-variable identifier="ITEM1.T"/>',
                  "",
                  itemRefXml(
                    "ITEM1",
                    "items/a.xml",
                    '<qti-variable-mapping source-identifier="SCORE" target-identifier="T"/>',
                  ),
                ),
                { "items/a.xml": itemXml("a", "SCORE") },
              ),
            ),
          );
        }),
    );

    it.effect(
      "[T-9] refuses a mapping whose source names nothing or a response as undeclared-variable, pantry's variable-mapping-source, and accepts one from a declared outcome",
      () =>
        Effect.gen(function* mappingSource() {
          const item = itemXml("a", "SCORE").replace(
            "<qti-outcome-declaration",
            '<qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier"/><qti-outcome-declaration',
          );
          const mappedFrom = (source: string) =>
            openPackage(
              location,
              mappingPackage(
                `<qti-variable-mapping source-identifier="${source}" target-identifier="T"/>`,
                item,
              ),
            );

          for (const source of ["NONE", "RESPONSE"]) {
            assert.deepStrictEqual(
              refusalsOf(yield* mappedFrom(source)),
              [
                {
                  detail: {
                    attribute: "source-identifier",
                    element: "qti-variable-mapping",
                    expected: "outcome",
                    identifier: source,
                  },
                  document: fileLocation(location, "test.xml"),
                  location: {
                    kind: "path",
                    path: `${itemRefChildAt("qti-variable-mapping")}/@source-identifier`,
                  },
                  rule: "undeclared-variable",
                },
              ],
              source,
            );
          }
          acceptedOf(yield* mappedFrom("SCORE"));
        }),
    );

    it.effect(
      "[T-9] refuses a second mapping on one item ref to one target as duplicate-identifier, pantry's variable-mapping-target, and accepts two mappings to two targets",
      () =>
        Effect.gen(function* mappingTarget() {
          const item = itemXml("a", "SCORE", "BONUS");
          const mappedTo = (second: string) =>
            openPackage(
              location,
              mappingPackage(
                `<qti-variable-mapping source-identifier="SCORE" target-identifier="T"/><qti-variable-mapping source-identifier="BONUS" target-identifier="${second}"/>`,
                item,
              ),
            );

          assert.deepStrictEqual(refusalsOf(yield* mappedTo("T")), [
            {
              detail: { identifier: "T" },
              document: fileLocation(location, "test.xml"),
              location: {
                kind: "path",
                path: `${itemRefChildAt("qti-variable-mapping[2]")}/@target-identifier`,
              },
              rule: "duplicate-identifier",
            },
          ]);
          acceptedOf(yield* mappedTo("U"));
        }),
    );

    it.effect(
      "[T-9] refuses a template default through the reach that is not its integer template variable's type, a string ITEM2.S or a multiple ITEM2.M, as expression-type, pantry's P20, and accepts ITEM2.N",
      () =>
        Effect.gen(function* templateDefaultType() {
          const cases = [
            ["ITEM2.S", "string", "single"],
            ["ITEM2.M", "integer", "multiple"],
          ] as const;

          for (const [reference, expressionBaseType, expressionCardinality] of cases) {
            const verdict = yield* openDefaulting("T", variableXml(reference));
            assert.deepStrictEqual(
              refusalsOf(verdict),
              [
                {
                  detail: {
                    element: "qti-template-default",
                    expressionBaseType,
                    expressionCardinality,
                    identifier: "T",
                    outcomeBaseType: "integer",
                    outcomeCardinality: "single",
                    targetKind: "template",
                  },
                  document: fileLocation(location, "test.xml"),
                  location: { kind: "path", path: firstRefChildAt("qti-template-default") },
                  rule: "expression-type",
                },
              ],
              reference,
            );
            assert.isTrue(acceptedAlone(verdict), reference);
          }
          acceptedOf(yield* openDefaulting("T", variableXml("ITEM2.N")));
        }),
    );

    it.effect(
      "[T-9] align-54 test assembly E14: refuses a float TOTAL set from ITEM1.RESPONSE, an identifier response read through the reach, as expression-type, pantry's P20, and accepts ITEM1.SCORE; a mapping target RESPONSE, typed as its float source, is no expression-type, but names the item's response RESPONSE, so it is refused as duplicate-identifier (reading 97 (\"a variable mapping's target names no other variable its item ref's item holds\"))",
      () =>
        Effect.gen(function* setThroughReach() {
          const setFrom = (reference: string, firstRef = "") =>
            openPackage(
              location,
              reachPackage(settingTotal(`<qti-variable identifier="${reference}"/>`), firstRef),
            );
          const verdict = yield* setFrom("ITEM1.RESPONSE");

          assert.deepStrictEqual(refusalsOf(verdict), [
            {
              detail: {
                element: "qti-set-outcome-value",
                expressionBaseType: "identifier",
                expressionCardinality: "single",
                identifier: "TOTAL",
                outcomeBaseType: "float",
                outcomeCardinality: "single",
              },
              document: fileLocation(location, "test.xml"),
              location: {
                kind: "path",
                path: "qti-assessment-test/qti-outcome-processing/qti-set-outcome-value",
              },
              rule: "expression-type",
            },
          ]);
          assert.isTrue(acceptedAlone(verdict), "the test alone is accepted");
          acceptedOf(yield* setFrom("ITEM1.SCORE"));
          assert.deepStrictEqual(
            refusalsOf(
              yield* setFrom(
                "ITEM1.RESPONSE",
                '<qti-variable-mapping source-identifier="SCORE" target-identifier="RESPONSE"/>',
              ),
            ).map(({ detail, rule }) => [rule, detail["identifier"], detail["reading"]]),
            [["duplicate-identifier", "RESPONSE", "97"]],
          );
        }),
    );

    it.effect(
      "[T-9] refuses a qti-outcome-if over ITEM1.SCORE, a float read through the reach, as expression-type with check condition, pantry's P21, and accepts one over ITEM1.CORRECT",
      () =>
        Effect.gen(function* conditionThroughReach() {
          const branching = (reference: string) =>
            openPackage(
              location,
              reachPackage(
                `<qti-outcome-condition><qti-outcome-if><qti-variable identifier="${reference}"/>${settingTotal(oneFloat)}</qti-outcome-if></qti-outcome-condition>`,
              ),
            );
          const verdict = yield* branching("ITEM1.SCORE");

          assert.deepStrictEqual(refusalsOf(verdict), [
            {
              detail: {
                check: "condition",
                element: "qti-outcome-if",
                expressionBaseType: "float",
                expressionCardinality: "single",
              },
              document: fileLocation(location, "test.xml"),
              location: {
                kind: "path",
                path: "qti-assessment-test/qti-outcome-processing/qti-outcome-condition/qti-outcome-if",
              },
              rule: "expression-type",
            },
          ]);
          assert.isTrue(acceptedAlone(verdict), "the test alone is accepted");
          acceptedOf(yield* branching("ITEM1.CORRECT"));
        }),
    );

    it.effect(
      "[T-9] refuses a qti-sum over ITEM1.RESPONSE, an identifier read through the reach, as expression-type with check operand, pantry's P23, accepts one over ITEM1.SCORE, and gives an unresolved ITEM9.RESPONSE its reading refusal alone",
      () =>
        Effect.gen(function* operandThroughReach() {
          const verdict = yield* openSettingTotal(
            `<qti-sum>${variableXml("ITEM1.RESPONSE")}</qti-sum>`,
          );

          assert.deepStrictEqual(
            refusalsOf(verdict).map(({ detail, location: at, rule }) => [
              rule,
              detail["check"],
              detail["element"],
              detail["operand"],
              detail["expressionBaseType"],
              at,
            ]),
            [
              [
                "expression-type",
                "operand",
                "qti-sum",
                "1",
                "identifier",
                { kind: "path", path: expressionAt("qti-sum") },
              ],
            ],
          );
          assert.isTrue(acceptedAlone(verdict), "the test alone is accepted");
          acceptedOf(yield* openSettingTotal(`<qti-sum>${variableXml("ITEM1.SCORE")}</qti-sum>`));
          assert.deepStrictEqual(
            refusalsOf(
              yield* openSettingTotal(`<qti-sum>${variableXml("ITEM9.RESPONSE")}</qti-sum>`),
            ).map((refusal) => [refusal.rule, refusal.detail["check"]]),
            [["undeclared-variable", "reading"]],
          );
        }),
    );

    it.effect(
      "[T-9] refuses a reference attribute naming ITEM1.RESPONSE or ITEM1.COUNT, responses read through the reach, once each as expression-type with check reference, pantry's P24, and accepts ITEM1.FIGURES, an integer outcome",
      () =>
        Effect.gen(function* referenceThroughReach() {
          for (const reference of ["ITEM1.RESPONSE", "ITEM1.COUNT"]) {
            const verdict = yield* openSettingTotal(roundedXml(reference));

            assert.deepStrictEqual(
              refusalsOf(verdict),
              [
                {
                  detail: {
                    attribute: "figures",
                    check: "reference",
                    element: "qti-round-to",
                    expectedBaseType: "integer",
                    identifier: reference,
                  },
                  document: fileLocation(location, "test.xml"),
                  location: { kind: "path", path: expressionAt("qti-round-to") },
                  rule: "expression-type",
                },
              ],
              reference,
            );
            assert.isTrue(acceptedAlone(verdict), reference);
          }
          acceptedOf(yield* openSettingTotal(roundedXml("ITEM1.FIGURES")));
        }),
    );

    it.effect(
      "[T-9] gives a test's ordinary type refusal once, from the test document's verdict, and never again from the reach (Admission A5)",
      () =>
        Effect.gen(function* ordinaryOnce() {
          const verdict = yield* openPackage(
            location,
            reachPackage(settingTotal('<qti-base-value base-type="string">x</qti-base-value>')),
          );

          assert.deepStrictEqual(refusalsOf(verdict), [
            {
              detail: {
                element: "qti-set-outcome-value",
                expressionBaseType: "string",
                expressionCardinality: "single",
                identifier: "TOTAL",
                outcomeBaseType: "float",
                outcomeCardinality: "single",
              },
              document: fileLocation(location, "test.xml"),
              location: {
                kind: "path",
                path: "qti-assessment-test/qti-outcome-processing/qti-set-outcome-value",
              },
              rule: "expression-type",
            },
          ]);
          assert.deepStrictEqual(documentVerdict(resourceOf(verdict, "T")), Option.some("refused"));
        }),
    );

    it.effect(
      "[T-9] refuses a template default naming no template variable of its item, nothing or an outcome, as undeclared-variable, pantry's template-default-target, and accepts one of its template variable's type",
      () =>
        Effect.gen(function* templateDefaultTarget() {
          const three = '<qti-base-value base-type="integer">3</qti-base-value>';

          for (const target of ["NOPE", "SCORE"]) {
            assert.deepStrictEqual(
              refusalsOf(yield* openDefaulting(target, three)),
              [
                {
                  detail: {
                    attribute: "template-identifier",
                    element: "qti-template-default",
                    expected: "template",
                    identifier: target,
                  },
                  document: fileLocation(location, "test.xml"),
                  location: {
                    kind: "path",
                    path: `${firstRefChildAt("qti-template-default")}/@template-identifier`,
                  },
                  rule: "undeclared-variable",
                },
              ],
              target,
            );
          }
          acceptedOf(yield* openDefaulting("T", three));
        }),
    );

    it.effect(
      `[T-9] refuses a prefixed map-response that resolves to nothing as undeclared-variable, pantry's prefixed-ref, and accepts ITEM1.MAPPED, a response with a mapping (reading 48 ("a dotted reference is accepted when exactly one reading names a real item ref, test part or section and its variable"))`,
      () =>
        Effect.gen(function* mapResponseReading() {
          const verdict = yield* openSettingTotal(
            '<qti-map-response identifier="ITEM9.RESPONSE"/>',
          );

          assert.deepStrictEqual(refusalsOf(verdict), [
            {
              detail: {
                check: "reading",
                element: "qti-map-response",
                identifier: "ITEM9.RESPONSE",
                reading: "48",
              },
              document: fileLocation(location, "test.xml"),
              location: { kind: "path", path: `${expressionAt("qti-map-response")}/@identifier` },
              rule: "undeclared-variable",
            },
          ]);
          assert.isTrue(acceptedAlone(verdict), "the test alone is accepted");
          acceptedOf(yield* openSettingTotal('<qti-map-response identifier="ITEM1.MAPPED"/>'));
        }),
    );

    it.effect(
      "[T-9] refuses a prefixed map-response of a response with no mapping, and a prefixed map-response-point of a point with no area mapping, as template-requirements, as an item's (info.txt:9306; G-R3, pending)",
      () =>
        Effect.gen(function* unmappedThroughReach() {
          const cases = [
            ["qti-map-response", "ITEM1.RESPONSE", { child: "qti-mapping" }],
            [
              "qti-map-response-point",
              "ITEM1.POINT",
              { baseType: "point", child: "qti-area-mapping" },
            ],
          ] as const;

          for (const [element, reference, needs] of cases) {
            const verdict = yield* openSettingTotal(`<${element} identifier="${reference}"/>`);
            assert.deepStrictEqual(
              refusalsOf(verdict),
              [
                {
                  detail: {
                    ...needs,
                    declaration: "qti-response-declaration",
                    element,
                    identifier: reference,
                    prefix: "ITEM1",
                  },
                  document: fileLocation(location, "test.xml"),
                  location: { kind: "path", path: expressionAt(element) },
                  rule: "template-requirements",
                },
              ],
              reference,
            );
            assert.isTrue(acceptedAlone(verdict), reference);
          }
          acceptedOf(yield* openSettingTotal('<qti-map-response identifier="ITEM1.MAPPED"/>'));
        }),
    );

    it.effect(
      "[T-9] refuses a map-response of a dotted name that reads no response (an outcome, a template variable, a built-in) once, as undeclared-variable expecting a response, as an item's (info.txt:9306; G-R3, pending)",
      () =>
        Effect.gen(function* mapResponseOfNoResponse() {
          const cases = [
            ["qti-map-response", "ITEM1.SCORE"],
            ["qti-map-response", "ITEM1.T"],
            ["qti-map-response", "ITEM1.numAttempts"],
            ["qti-map-response-point", "ITEM1.SCORE"],
          ] as const;

          for (const [element, reference] of cases) {
            const verdict = yield* openSettingTotal(`<${element} identifier="${reference}"/>`);
            assert.deepStrictEqual(
              refusalsOf(verdict),
              [
                {
                  detail: { element, expected: "response", identifier: reference, prefix: "ITEM1" },
                  document: fileLocation(location, "test.xml"),
                  location: { kind: "path", path: `${expressionAt(element)}/@identifier` },
                  rule: "undeclared-variable",
                },
              ],
              `${element} ${reference}`,
            );
            assert.isTrue(acceptedAlone(verdict), `${element} ${reference}`);
          }
        }),
    );

    it.effect(
      "[T-9] controls for a map-response of a dotted name that reads no response: ITEM1.MAPPED, a response with a mapping, is accepted, and an unresolvable name keeps its one reading refusal",
      () =>
        Effect.gen(function* mapResponseOfNoResponseControls() {
          acceptedOf(yield* openSettingTotal('<qti-map-response identifier="ITEM1.MAPPED"/>'));

          const verdict = yield* openSettingTotal(
            '<qti-map-response identifier="ITEM9.RESPONSE"/>',
          );
          assert.deepStrictEqual(
            refusalsOf(verdict).map(({ detail, rule }) => [rule, detail["check"]]),
            [["undeclared-variable", "reading"]],
          );
        }),
    );

    it.effect(
      '[T-9] refuses a dotted point without an area mapping, ITEM1.MAPPED_POINT, a point response that declares a qti-mapping only, once as template-requirements, as an item\'s, and accepts ITEM1.AREA_POINT (info.txt:9314; reading 111 ("a processing element\'s `identifier` names a variable of the kind the element reads or sets"), with G-R3 194, pending, for the mapping ("a prefixed map-response or map-response-point of a response with no mapping is refused"))',
      () =>
        Effect.gen(function* dottedPointWithoutAreaMapping() {
          const verdict = yield* openSettingThroughPoints(
            "false",
            '<qti-map-response-point identifier="ITEM1.MAPPED_POINT"/>',
          );

          assert.deepStrictEqual(refusalsOf(verdict), [
            {
              detail: {
                baseType: "point",
                child: "qti-area-mapping",
                declaration: "qti-response-declaration",
                element: "qti-map-response-point",
                identifier: "ITEM1.MAPPED_POINT",
                prefix: "ITEM1",
              },
              document: fileLocation(location, "test.xml"),
              location: { kind: "path", path: expressionAt("qti-map-response-point") },
              rule: "template-requirements",
            },
          ]);
          assert.isTrue(acceptedAlone(verdict), "the test alone is accepted");
          acceptedOf(
            yield* openSettingThroughPoints(
              "false",
              '<qti-map-response-point identifier="ITEM1.AREA_POINT"/>',
            ),
          );
        }),
    );

    it.effect(
      '[T-9] built-in maps nothing: a dotted map-response-point of ITEM1.numAttempts, and a dotted map-response of a timed ITEM1.duration and of P.duration and SEC.duration, are refused once as undeclared-variable expecting a response (info.txt:9306, info.txt:9314; reading 111 ("a processing element\'s `identifier` names a variable of the kind the element reads or sets"), with G-R3 194, pending, for the mapping ("a prefixed map-response or map-response-point of a response with no mapping is refused"))',
      () =>
        Effect.gen(function* builtInMapsNothing() {
          const cases = [
            ["qti-map-response-point", "ITEM1.numAttempts", "false", "ITEM1"],
            ["qti-map-response", "ITEM1.duration", "true", "ITEM1"],
            ["qti-map-response", "P.duration", "false", "P"],
            ["qti-map-response", "SEC.duration", "false", "SEC"],
          ] as const;

          for (const [element, reference, timeDependent, prefix] of cases) {
            const verdict = yield* openSettingThroughPoints(
              timeDependent,
              `<${element} identifier="${reference}"/>`,
            );
            assert.deepStrictEqual(
              refusalsOf(verdict),
              [
                {
                  detail: { element, expected: "response", identifier: reference, prefix },
                  document: fileLocation(location, "test.xml"),
                  location: { kind: "path", path: `${expressionAt(element)}/@identifier` },
                  rule: "undeclared-variable",
                },
              ],
              `${element} ${reference}`,
            );
            assert.isTrue(acceptedAlone(verdict), `${element} ${reference}`);
          }
        }),
    );

    it.effect(
      '[T-9] align-54 untimed duration D7: built-in maps nothing: a dotted map-response of an untimed item\'s ITEM1.duration is refused once as undeclared-variable, the response it does not read, as a timed item\'s is (reading 150 ("an item\'s built-in `duration` may be read whether or not the item is time dependent"); info.txt:9306; reading 111 ("a processing element\'s `identifier` names a variable of the kind the element reads or sets"), with G-R3 194, pending, for the mapping ("a prefixed map-response or map-response-point of a response with no mapping is refused"))',
      () =>
        Effect.gen(function* untimedBuiltInMapsNothing() {
          const verdict = yield* openSettingThroughPoints(
            "false",
            '<qti-map-response identifier="ITEM1.duration"/>',
          );
          const at = {
            document: fileLocation(location, "test.xml"),
            location: { kind: "path", path: `${expressionAt("qti-map-response")}/@identifier` },
            rule: "undeclared-variable",
          } as const;

          assert.deepStrictEqual(refusalsOf(verdict), [
            {
              ...at,
              detail: {
                element: "qti-map-response",
                expected: "response",
                identifier: "ITEM1.duration",
                prefix: "ITEM1",
              },
            },
          ]);
          assert.isTrue(acceptedAlone(verdict), "the test alone is accepted");
        }),
    );

    it.effect(
      "align-54 built-ins by kind E22a: a built-in maps nothing in an item: a qti-map-response of numAttempts, and a qti-map-response-point of a timed item's duration, are refused as template-requirements at the item's own document, since a built-in response has no mapping, and AREA_POINT is accepted (info.txt:9306, info.txt:9314; reading 111 (\"a processing element's `identifier` names a variable of the kind the element reads or sets\"); pantry's Mapped response law, P27; with G-R3 194, pending, for the mapping (\"a prefixed map-response or map-response-point of a response with no mapping is refused\"))",
      () =>
        Effect.gen(function* itemBuiltInMapsNothing() {
          const cases = [
            ["qti-map-response", "numAttempts", "false", { child: "qti-mapping" }],
            [
              "qti-map-response-point",
              "duration",
              "true",
              { baseType: "point", child: "qti-area-mapping" },
            ],
          ] as const;

          for (const [element, identifier, timeDependent, needs] of cases) {
            assert.deepStrictEqual(
              refusalsOf(
                yield* openScoringPoints(timeDependent, `<${element} identifier="${identifier}"/>`),
              ),
              [
                {
                  detail: {
                    ...needs,
                    declaration: "qti-response-declaration",
                    element,
                    identifier,
                  },
                  document: fileLocation(location, "items/a.xml"),
                  location: {
                    kind: "path",
                    path: `qti-assessment-item/qti-response-processing/qti-set-outcome-value/${element}`,
                  },
                  rule: "template-requirements",
                },
              ],
              `${element} ${identifier}`,
            );
          }
          acceptedOf(
            yield* openScoringPoints("false", '<qti-map-response-point identifier="AREA_POINT"/>'),
          );
        }),
    );

    it.effect(
      "[T-9] qti-correct reads a response: refuses ITEM1.SCORE and ITEM1.T, an outcome and a template variable, once each as undeclared-variable expecting a response (info.txt:9302; G-R3, pending)",
      () =>
        Effect.gen(function* correctOfNoResponse() {
          for (const reference of ["ITEM1.SCORE", "ITEM1.T"]) {
            const verdict = yield* openTestingNull(`<qti-correct identifier="${reference}"/>`);
            assert.deepStrictEqual(
              refusalsOf(verdict),
              [
                {
                  detail: {
                    element: "qti-correct",
                    expected: "response",
                    identifier: reference,
                    prefix: "ITEM1",
                  },
                  document: fileLocation(location, "test.xml"),
                  location: { kind: "path", path: `${nullTestedAt("qti-correct")}/@identifier` },
                  rule: "undeclared-variable",
                },
              ],
              reference,
            );
            assert.isTrue(acceptedAlone(verdict), reference);
          }
        }),
    );

    it.effect(
      `[T-9] controls for qti-correct reads a response: ITEM1.RESPONSE, a response, and a qti-default of ITEM1.SCORE are accepted, and an unresolvable ITEM9.RESPONSE keeps its one reading refusal (reading 48 ("a dotted reference is accepted when exactly one reading names a real item ref, test part or section and its variable"))`,
      () =>
        Effect.gen(function* correctOfResponseControls() {
          acceptedOf(yield* openTestingNull('<qti-correct identifier="ITEM1.RESPONSE"/>'));
          acceptedOf(yield* openTestingNull('<qti-default identifier="ITEM1.SCORE"/>'));
          assert.deepStrictEqual(
            refusalsOf(yield* openTestingNull('<qti-correct identifier="ITEM9.RESPONSE"/>')),
            [
              {
                detail: {
                  check: "reading",
                  element: "qti-correct",
                  identifier: "ITEM9.RESPONSE",
                  reading: "48",
                },
                document: fileLocation(location, "test.xml"),
                location: { kind: "path", path: `${nullTestedAt("qti-correct")}/@identifier` },
                rule: "undeclared-variable",
              },
            ],
          );
        }),
    );

    it.effect(
      'align-54 prefixed references E22b: a built-in read through a prefix is judged by its kind: a qti-correct of ITEM1.numAttempts or ITEM1.duration, each a response of the item, or of SEC.duration, a response of the section, is accepted (reading 111 ("a processing element\'s `identifier` names a variable of the kind the element reads or sets"))',
      () =>
        Effect.gen(function* correctOfBuiltInResponse() {
          for (const reference of ["ITEM1.numAttempts", "ITEM1.duration", "SEC.duration"]) {
            const verdict = yield* openTestingNull(`<qti-correct identifier="${reference}"/>`);
            assert.deepStrictEqual(refusalsOf(verdict), [], reference);
            acceptedOf(verdict);
          }
        }),
    );

    it.effect(
      'align-54 prefixed references E22b: control: a qti-map-response of ITEM1.numAttempts stays refused once as undeclared-variable expecting a response, since a built-in response declares no mapping (reading 111 ("a processing element\'s `identifier` names a variable of the kind the element reads or sets"), with G-R3 194, pending, for the mapping ("a prefixed map-response or map-response-point of a response with no mapping is refused"))',
      () =>
        Effect.gen(function* mapResponseOfBuiltIn() {
          const verdict = yield* openSettingTotal(
            '<qti-map-response identifier="ITEM1.numAttempts"/>',
          );

          assert.deepStrictEqual(refusalsOf(verdict), [
            {
              detail: {
                element: "qti-map-response",
                expected: "response",
                identifier: "ITEM1.numAttempts",
                prefix: "ITEM1",
              },
              document: fileLocation(location, "test.xml"),
              location: { kind: "path", path: `${expressionAt("qti-map-response")}/@identifier` },
              rule: "undeclared-variable",
            },
          ]);
          assert.isTrue(acceptedAlone(verdict), "the test alone is accepted");
        }),
    );

    it.effect(
      "[T-9] a qti-correct of a dotted name read through an item ref is refused with that ref as its prefix and the item-ref sentence (dotted wording through a ref only)",
      () =>
        Effect.gen(function* dottedWordingThroughRefOnly() {
          const through = refusalsIn(
            yield* openTestingNull('<qti-correct identifier="ITEM1.SCORE"/>'),
          );

          assert.deepStrictEqual(
            through.map((refusal) => refusal.detail),
            [
              {
                element: "qti-correct",
                expected: "response",
                identifier: "ITEM1.SCORE",
                prefix: "ITEM1",
              },
            ],
          );
          assert.include(
            through.map((refusal) => describeRefusal(refusal)).join("\n"),
            "To make it valid: name a response the item declares, written `ITEMREF.RESPONSE`.",
          );
        }),
    );

    it.effect(
      "[T-9] a qti-correct of a dotted outcome the test declares whole is refused with no prefix and the test as the declarer, and its sentence says the test declares no response, claims no read through a ref, and gives an item's response through its item ref as the fix",
      () =>
        Effect.gen(function* wholeDottedTestDeclarer() {
          const whole = refusalsIn(
            yield* openPackage(
              location,
              readingPackage(
                `<qti-assessment-test xmlns="${qti}" identifier="T" title="T"><qti-outcome-declaration identifier="TOTAL" cardinality="single" base-type="float"/><qti-outcome-declaration identifier="A.B" cardinality="single" base-type="float"/><qti-test-part identifier="P" navigation-mode="linear" submission-mode="individual"><qti-assessment-section identifier="SEC" title="SEC" visible="true">${itemRefXml("ITEM1", "items/a.xml")}</qti-assessment-section></qti-test-part><qti-outcome-processing><qti-outcome-condition><qti-outcome-if><qti-is-null><qti-correct identifier="A.B"/></qti-is-null>${settingTotal(oneFloat)}</qti-outcome-if></qti-outcome-condition></qti-outcome-processing></qti-assessment-test>`,
                { "items/a.xml": reachedItemXml },
              ),
            ),
          );

          assert.deepStrictEqual(
            whole.map((refusal) => refusal.detail),
            [{ declarer: "test", element: "qti-correct", expected: "response", identifier: "A.B" }],
          );

          const sentence = whole.map((refusal) => describeRefusal(refusal)).join("\n");
          assert.include(
            sentence,
            "`qti-correct` names `A.B`, and the test declares no response `A.B`; only an item declares responses.",
          );
          assert.include(
            sentence,
            "To make it valid: name a response an item declares, through its item ref, written `ITEMREF.RESPONSE`.",
          );
          assert.notInclude(sentence, "reads, through an item ref");
          assert.notInclude(sentence, "the item declares");
          assert.notInclude(sentence, "declare `A.B`");
        }),
    );

    it.effect(
      '[T-9] align-54 prefixed references D6: a setter is judged by its unsplit reading alone: ITEM1.SCORE, which item ref ITEM1 resolves, ITEM9.SCORE, which no item ref resolves, and the untimed ITEM1.duration, each set by qti-set-outcome-value or qti-lookup-outcome-value and none declared by the test, are refused once as undeclared-variable with check setter (reading 112 ("a test\'s setter sets a variable of its own document, so a prefixed reading never resolves it"))',
      () =>
        Effect.gen(function* setterOfItemVariable() {
          for (const element of ["qti-set-outcome-value", "qti-lookup-outcome-value"]) {
            for (const reference of ["ITEM1.SCORE", "ITEM9.SCORE", "ITEM1.duration"]) {
              const verdict = yield* openPackage(
                location,
                reachPackage(settingOne(element, reference)),
              );
              assert.deepStrictEqual(
                refusalsOf(verdict),
                [
                  {
                    detail: {
                      check: "setter",
                      element,
                      identifier: reference,
                      reading: "112",
                      reference,
                    },
                    document: fileLocation(location, "test.xml"),
                    location: { kind: "path", path: `${ruleAt(element)}/@identifier` },
                    rule: "undeclared-variable",
                  },
                ],
                `${element} ${reference}`,
              );
              assert.isTrue(acceptedAlone(verdict), `${element} ${reference}`);
            }
          }
        }),
    );

    it.effect(
      '[T-9] align-54 prefixed references D6: a setter of ITEM1.X.SCORE beside item refs ITEM1 and ITEM1.X, which two split readings would resolve, is refused once as undeclared-variable with check setter, never ambiguous-reference (reading 112 ("a test\'s setter sets a variable of its own document, so a prefixed reading never resolves it"))',
      () =>
        Effect.gen(function* setterBesideTwoReadings() {
          const verdict = yield* openPackage(
            location,
            nestedRefsPackage(settingOne("qti-set-outcome-value", "ITEM1.X.SCORE")),
          );

          assert.deepStrictEqual(refusalsOf(verdict), [
            {
              detail: {
                check: "setter",
                element: "qti-set-outcome-value",
                identifier: "ITEM1.X.SCORE",
                reading: "112",
                reference: "ITEM1.X.SCORE",
              },
              document: fileLocation(location, "test.xml"),
              location: {
                kind: "path",
                path: `${ruleAt("qti-set-outcome-value")}/@identifier`,
              },
              rule: "undeclared-variable",
            },
          ]);
          assert.isTrue(acceptedAlone(verdict));
        }),
    );

    it.effect(
      '[T-9] align-54 prefixed references D6: controls for a setter: a.SCORE, which the test declares and sets beside item ref a whose item declares SCORE, is accepted and not ambiguous, and the qti-variable forms of ITEM9.SCORE and ITEM1.X.SCORE keep their reading and ambiguous-reference refusals (reading 112 ("a test\'s setter sets a variable of its own document, so a prefixed reading never resolves it"); reading 48 ("a dotted reference is accepted when exactly one reading names a real item ref, test part or section and its variable"))',
      () =>
        Effect.gen(function* setterControls() {
          acceptedOf(
            yield* openPackage(
              location,
              readingPackage(
                `<qti-assessment-test xmlns="${qti}" identifier="T" title="T"><qti-outcome-declaration identifier="a.SCORE" cardinality="single" base-type="float"/><qti-test-part identifier="P" navigation-mode="linear" submission-mode="individual"><qti-assessment-section identifier="SEC" title="SEC" visible="true">${itemRefXml("a", "items/a.xml")}</qti-assessment-section></qti-test-part><qti-outcome-processing>${settingOne("qti-set-outcome-value", "a.SCORE")}</qti-outcome-processing></qti-assessment-test>`,
                { "items/a.xml": itemXml("a", "SCORE") },
              ),
            ),
          );
          assert.deepStrictEqual(
            refusalsOf(yield* openSettingTotal(variableXml("ITEM9.SCORE"))).map(
              ({ detail, rule }) => [rule, detail["check"]],
            ),
            [["undeclared-variable", "reading"]],
          );
          assert.deepStrictEqual(
            readings(
              yield* openPackage(
                location,
                nestedRefsPackage(settingTotal(variableXml("ITEM1.X.SCORE"))),
              ),
            ),
            [["ITEM1", "X.SCORE", "ITEM1.X", "SCORE"]],
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
                "items/a b.xml": itemXml("a", "SCORE"),
                [manifestFile]: manifestXml(
                  resourceXml("T", "imsqti_test_xmlv3p0", "tests/test.xml"),
                  resourceXml("A", "imsqti_item_xmlv3p0", "items/a%20b.xml"),
                ),
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

    it.effect(
      `[T-9] accepts I1.SCORE and S2.duration that a section document in the reach holds, its item ref resolved from its own path, with the test's processing marked by name and its items its own (reading 48 ("a dotted reference is accepted when exactly one reading names a real item ref, test part or section and its variable"))`,
      () =>
        Effect.gen(function* reachedReads() {
          const testPath = fileLocation(location, "test.xml");
          const cases = [
            ["I1.SCORE", settingTotal(variableXml("I1.SCORE"))],
            [
              "S2.duration",
              `<qti-outcome-condition><qti-outcome-if><qti-is-null>${variableXml("S2.duration")}</qti-is-null>${settingTotal(oneFloat)}</qti-outcome-if></qti-outcome-condition>`,
            ],
          ] as const;

          for (const [reference, processing] of cases) {
            const verdict = yield* openReferring(processing);
            const { items, test } = testOf(acceptedOf(verdict), testPath);

            assert.strictEqual(verdict.verdict, "accepted-with-unsupported", reference);
            assert.deepStrictEqual(test.test.outcomeProcessing, { kind: "marked" }, reference);
            assert.deepStrictEqual(
              test.unsupported.map((feature) => feature.feature),
              ["qti-assessment-section-ref", `variable:${reference}`],
              reference,
            );
            assert.deepStrictEqual([...items.keys()], ["ITEM0"], reference);
          }
        }),
    );

    it.effect(
      "[T-9] refuses a section document in the reach whose item ref sets a template variable its item does not declare, or maps from a response, at the section document, as pantry does",
      () =>
        Effect.gen(function* reachedItemRefs() {
          assert.deepStrictEqual(
            refusalsOf(
              yield* openReferring(
                settingTotal(oneFloat),
                '<qti-template-default template-identifier="NOPE"><qti-base-value base-type="integer">1</qti-base-value></qti-template-default>',
              ),
            ),
            [
              atSection("qti-template-default", "template-identifier", {
                attribute: "template-identifier",
                element: "qti-template-default",
                expected: "template",
                identifier: "NOPE",
              }),
            ],
          );
          assert.deepStrictEqual(
            refusalsOf(
              yield* openReferring(
                settingTotal(oneFloat),
                '<qti-variable-mapping source-identifier="RESPONSE" target-identifier="X"/>',
              ),
            ),
            [
              atSection("qti-variable-mapping", "source-identifier", {
                attribute: "source-identifier",
                element: "qti-variable-mapping",
                expected: "outcome",
                identifier: "RESPONSE",
              }),
            ],
          );
          acceptedOf(
            yield* openReferring(
              settingTotal(oneFloat),
              '<qti-variable-mapping source-identifier="SCORE" target-identifier="X"/><qti-template-default template-identifier="T"><qti-base-value base-type="integer">1</qti-base-value></qti-template-default>',
            ),
          );
        }),
    );

    it.effect(
      `[T-9] refuses I9.SCORE once, and I1.SCORE past a section ref whose href names no section resource, as a section document in the reach adds only what it holds (reading 48 ("a dotted reference is accepted when exactly one reading names a real item ref, test part or section and its variable"))`,
      () =>
        Effect.gen(function* reachedOnly() {
          const unread = (reference: string): Seen => ({
            detail: {
              check: "reading",
              element: "qti-variable",
              identifier: reference,
              reading: "48",
            },
            document: fileLocation(location, "test.xml"),
            location: {
              kind: "path",
              path: `qti-assessment-test/qti-outcome-processing/qti-set-outcome-value/qti-variable/@identifier`,
            },
            rule: "undeclared-variable",
          });

          assert.deepStrictEqual(
            refusalsOf(yield* openReferring(settingTotal(variableXml("I9.SCORE")))),
            [unread("I9.SCORE")],
          );
          assert.deepStrictEqual(
            refusalsOf(
              yield* openPackage(
                location,
                packageOf(
                  referringFiles(
                    settingTotal(variableXml("I1.SCORE")),
                    sectionRefXml("R", "sections/none.xml"),
                    sectionXml(),
                  ),
                ),
              ),
            ),
            [
              unread("I1.SCORE"),
              missingReference(
                "qti-assessment-test/qti-test-part/qti-assessment-section-ref",
                "href",
                "sections/none.xml",
                "test.xml",
              ),
            ],
          );
        }),
    );

    it.effect(
      "[T-9] align-54 test assembly E7: judges a section document's item refs once for two section refs to it and a second test, giving its refusal once, and refuses its own section ref to itself as inclusion-cycle once under each test, naming that test's chain (reading 85 (\"an inclusion never reaches itself\"))",
      () =>
        Effect.gen(function* reachedOnce() {
          const files = referringFiles(
            settingTotal(oneFloat),
            `${sectionRefXml("R1", "sections/s2.xml")}${sectionRefXml("R2", "./sections/s2.xml")}`,
            sectionXml(
              `<qti-template-default template-identifier="NOPE"><qti-base-value base-type="integer">1</qti-base-value></qti-template-default>`,
              sectionRefXml("SELF", "s2.xml"),
            ),
          );
          const verdict = yield* openPackage(
            location,
            packageOf({
              ...files,
              [manifestFile]: manifestXml(
                resourceXml("T", "imsqti_test_xmlv3p0", "test.xml"),
                resourceXml("T2", "imsqti_test_xmlv3p0", "test2.xml"),
                resourceXml("I0", "imsqti_item_xmlv3p0", "items/b.xml"),
                resourceXml("I1", "imsqti_item_xmlv3p0", "items/a.xml"),
                resourceXml("S", "imsqti_section_xmlv3p0", "sections/s2.xml"),
              ),
              "test2.xml": referringTestXml(
                settingTotal(oneFloat),
                sectionRefXml("R", "sections/s2.xml"),
              ).replace('identifier="T" title="T"', 'identifier="T2" title="T2"'),
            }),
          );

          assert.deepStrictEqual(
            refusalsOf(verdict).map((refusal) => [
              refusal.rule,
              refusal.document,
              refusal.detail["chain"],
            ]),
            [
              ["undeclared-variable", fileLocation(location, "sections/s2.xml"), undefined],
              [
                "inclusion-cycle",
                fileLocation(location, "sections/s2.xml"),
                "test.xml sections/s2.xml sections/s2.xml",
              ],
              [
                "inclusion-cycle",
                fileLocation(location, "sections/s2.xml"),
                "test2.xml sections/s2.xml sections/s2.xml",
              ],
            ],
          );
        }),
    );

    it.effect(
      "gives a verdict for a long chain of section refs, 2,048 section documents each naming the next, the most plate's assembly limit admits, and does not throw (R5)",
      () => acceptsChain(2048),
      chainTimeoutMs,
    );

    it.effect(
      "align-54 r12 assembly limit R5: a chain of 8,000 section documents each naming the next is refused assembly-limit naming the placements bound, and does not throw",
      () =>
        Effect.gen(function* longChainRefused() {
          const verdict = yield* openPackage(location, chainPackage(8000));
          assert.deepStrictEqual(refusalsOf(verdict), [
            limitRefused("placements", "2049"),
            ...documentRefusals(verdict),
          ]);
        }),
      chainTimeoutMs,
    );

    it.effect(
      "gives the same verdict for a long chain of section refs of 1,500 section documents, the control",
      () => acceptsChain(1500),
      chainTimeoutMs,
    );

    it.effect(
      "refuses ITEM0, a duplicate across the reach of the test's own item ref, once at the section document's item ref, however many tests reach it, as pantry's structure-identifier does (info.txt:10759)",
      () =>
        Effect.gen(function* duplicateOfTheTest() {
          const section = sectionDocumentXml("S2", itemRefXml("ITEM0", "../items/a.xml"));
          const at = "qti-assessment-section/qti-assessment-item-ref";

          assert.deepStrictEqual(
            refusalsOf(
              yield* openPackage(
                location,
                packageOf(
                  reachingFiles(settingTotal(oneFloat), [
                    "S2",
                    itemRefXml("ITEM0", "../items/a.xml"),
                  ]),
                ),
              ),
            ),
            [duplicateIn("sections/S2.xml", at, "ITEM0")],
          );
          assert.deepStrictEqual(
            refusalsOf(
              yield* openPackage(
                location,
                packageOf({
                  ...twoReachingFiles(""),
                  "sections/s2.xml": section,
                }),
              ),
            ),
            [duplicateIn("sections/s2.xml", at, "ITEM0")],
          );
        }),
    );

    it.effect(
      "refuses ITEMQ, a duplicate across the reach of two section documents, once at the second, the first kept",
      () =>
        Effect.gen(function* duplicateOfASection() {
          const verdict = yield* openPackage(
            location,
            packageOf(
              reachingFiles(
                settingTotal(variableXml("ITEMQ.SCORE")),
                ["S2", itemRefXml("ITEMQ", "../items/a.xml")],
                ["S3", itemRefXml("ITEMQ", "../items/b.xml")],
              ),
            ),
          );

          assert.deepStrictEqual(refusalsOf(verdict), [
            duplicateIn(
              "sections/S3.xml",
              "qti-assessment-section/qti-assessment-item-ref",
              "ITEMQ",
            ),
          ]);
        }),
    );

    it.effect(
      "refuses a section document's item ref named like the test's part P or section SEC as a duplicate across the reach, and reads P.duration and SEC.duration as the test's own",
      () =>
        Effect.gen(function* duplicateOfAScope() {
          for (const scope of ["P", "SEC"]) {
            assert.deepStrictEqual(
              refusalsOf(
                yield* openPackage(
                  location,
                  packageOf(
                    reachingFiles(testingDuration(scope), [
                      "S2",
                      itemRefXml(scope, "../items/a.xml"),
                    ]),
                  ),
                ),
              ),
              [
                duplicateIn(
                  "sections/S2.xml",
                  "qti-assessment-section/qti-assessment-item-ref",
                  scope,
                ),
              ],
              scope,
            );
          }

          assert.deepStrictEqual(
            refusalsOf(
              yield* openPackage(
                location,
                packageOf(
                  reachingFiles(testingDuration("SEC"), [
                    "SEC",
                    itemRefXml("ITEMQ", "../items/a.xml"),
                  ]),
                ),
              ),
            ),
            [duplicateIn("sections/SEC.xml", "qti-assessment-section", "SEC")],
          );
        }),
    );

    it.effect(
      "gives no duplicate across the reach for one section document reached by two refs, or two with distinct identifiers, and leaves a duplicate within one document to its own verdict",
      () =>
        Effect.gen(function* noDuplicate() {
          acceptedOf(
            yield* openPackage(
              location,
              packageOf(
                referringFiles(
                  settingTotal(oneFloat),
                  `${sectionRefXml("R1", "sections/s2.xml")}${sectionRefXml("R2", "./sections/s2.xml")}`,
                  sectionXml(),
                ),
              ),
            ),
          );
          acceptedOf(
            yield* openPackage(
              location,
              packageOf(
                reachingFiles(
                  settingTotal(oneFloat),
                  ["S2", itemRefXml("ITEMQ", "../items/a.xml")],
                  ["S3", itemRefXml("ITEMR", "../items/b.xml")],
                ),
              ),
            ),
          );
          assert.deepStrictEqual(
            refusalsOf(
              yield* openPackage(
                location,
                packageOf(
                  reachingFiles(settingTotal(oneFloat), [
                    "S2",
                    `${itemRefXml("ITEM0", "../items/a.xml")}${itemRefXml("ITEM0", "../items/b.xml")}`,
                  ]),
                ),
              ),
            ),
            [
              duplicateIn(
                "sections/S2.xml",
                "qti-assessment-section/qti-assessment-item-ref[1]",
                "ITEM0",
              ),
              duplicateIn(
                "sections/S2.xml",
                "qti-assessment-section/qti-assessment-item-ref[2]",
                "ITEM0",
              ),
            ],
          );
        }),
    );

    it.effect(
      "[T-9] refuses a section document's pre-condition over NOPE, judged under the reaching test, as undeclared-variable at the section document, as pantry's P8 does",
      () =>
        Effect.gen(function* sectionUndeclared() {
          const verdict = yield* openReferring(
            settingTotal(oneFloat),
            preConditionXml(variableXml("NOPE")),
          );

          assert.deepStrictEqual(refusalsOf(verdict), [undeclaredNope]);
        }),
    );

    it.effect(
      "[T-9] refuses a section document's qti-gt over ITEM0.S, a string, or I1.CORRECT, a boolean, judged under the reaching test, as expression-type with check operand, pantry's P23",
      () =>
        Effect.gen(function* sectionOperand() {
          const cases = [
            ["ITEM0.S", "string"],
            ["I1.CORRECT", "boolean"],
          ] as const;

          for (const [reference, expressionBaseType] of cases) {
            const verdict = yield* openReferring(
              settingTotal(oneFloat),
              preConditionXml(greaterXml(reference)),
            );

            assert.deepStrictEqual(
              refusalsOf(verdict).map(({ detail, document, location: at, rule }) => [
                rule,
                detail["check"],
                detail["element"],
                detail["operand"],
                detail["expressionBaseType"],
                document,
                at,
              ]),
              [
                [
                  "expression-type",
                  "operand",
                  "qti-gt",
                  "1",
                  expressionBaseType,
                  fileLocation(location, "sections/s2.xml"),
                  { kind: "path", path: sectionRefChildAt("qti-pre-condition/qti-gt") },
                ],
              ],
              reference,
            );
          }
        }),
    );

    it.effect(
      "[T-9] refuses a section document's template default of its integer T from a float, judged under the reaching test, as expression-type at the default, pantry's P20",
      () =>
        Effect.gen(function* sectionDefault() {
          const verdict = yield* openReferring(settingTotal(oneFloat), floatDefaultXml);

          assert.deepStrictEqual(refusalsOf(verdict), [floatDefaultRefused]);
        }),
    );

    it.effect(
      `[T-9] refuses a dotted name in a section document that none of the reaching test's readings resolve, judged under the reaching test, as undeclared-variable at the section document (reading 48 ("a dotted reference is accepted when exactly one reading names a real item ref, test part or section and its variable"))`,
      () =>
        Effect.gen(function* sectionUnread() {
          const verdict = yield* openReferring(
            settingTotal(oneFloat),
            preConditionXml(variableXml("I9.SCORE")),
          );

          assert.deepStrictEqual(refusalsOf(verdict), [
            atSection("qti-pre-condition/qti-variable", "identifier", {
              check: "reading",
              element: "qti-variable",
              identifier: "I9.SCORE",
              reading: "48",
            }),
          ]);
        }),
    );

    it.effect(
      "[T-9] controls for a section judged under the reaching test: reached by no test its expressions keep its own verdict, under two tests each refusal is given once, and a pre-condition over TOTAL or I1.SCORE is accepted",
      () =>
        Effect.gen(function* sectionControls() {
          const unreached = yield* openPackage(
            location,
            packageOf(
              referringFiles(
                settingTotal(oneFloat),
                "",
                sectionXml(
                  `${preConditionXml(variableXml("NOPE"))}${preConditionXml(greaterXml("I9.SCORE"))}${floatDefaultXml}`,
                ),
              ),
            ),
          );
          acceptedOf(unreached);
          assert.isTrue(
            Option.exists(
              documentVerdict(resourceOf(unreached, "S")),
              (alone) => alone === "accepted" || alone === "accepted-with-unsupported",
            ),
            "the section document alone is accepted",
          );

          assert.deepStrictEqual(
            refusalsOf(
              yield* openPackage(
                location,
                packageOf(
                  twoReachingFiles(`${preConditionXml(variableXml("NOPE"))}${floatDefaultXml}`),
                ),
              ),
            ),
            [undeclaredNope, floatDefaultRefused],
          );

          for (const reference of ["TOTAL", "I1.SCORE"]) {
            acceptedOf(
              yield* openReferring(settingTotal(oneFloat), preConditionXml(greaterXml(reference))),
            );
          }
        }),
    );

    it.effect(
      "[T-9] gives the refusal at a second section document that a second test reaches, though the first gave one with the same rule, path and detail at its own",
      () =>
        Effect.gen(function* secondSectionRefusal() {
          const nope = preConditionXml(variableXml("NOPE"));
          const verdict = yield* openPackage(location, packageOf(twoSectionFiles(nope, nope)));

          assert.deepStrictEqual(refusalsOf(verdict), [
            undeclaredNope,
            { ...undeclaredNope, document: fileLocation(location, "sections/s3.xml") },
          ]);
        }),
    );

    it.effect(
      "[T-9] controls for the refusal at a second section document: one section document two tests reach gives its refusal once, and a second section document with no error gives none",
      () =>
        Effect.gen(function* secondSectionControls() {
          const nope = preConditionXml(variableXml("NOPE"));

          assert.deepStrictEqual(
            refusalsOf(yield* openPackage(location, packageOf(twoReachingFiles(nope)))),
            [undeclaredNope],
            "one section document two tests reach",
          );
          assert.deepStrictEqual(
            refusalsOf(yield* openPackage(location, packageOf(twoSectionFiles(nope, "")))),
            [undeclaredNope],
            "only the first section document in error",
          );
        }),
    );

    it.effect(
      "[T-9] align-54 prefixed references D6: dotted lookup and pattern through the package: the lookup of ITEM1.SCORE, which the test does not declare, is refused as a setter of an item's variable whatever its operand, and its operand is still judged, so a string is refused once more, as expression-type with reading 28, and an integer is not (reading 112 (\"a test's setter sets a variable of its own document, so a prefixed reading never resolves it\"))",
      () =>
        Effect.gen(function* lookupThroughPackage() {
          const setter: ReturnType<typeof lookupFacts>[number] = [
            "undeclared-variable",
            "qti-lookup-outcome-value",
            "ITEM1.SCORE",
            "112",
            undefined,
            fileLocation(location, "test.xml"),
            { kind: "path", path: `${ruleAt("qti-lookup-outcome-value")}/@identifier` },
          ];

          assert.deepStrictEqual(
            lookupFacts(
              yield* openLookingUp('<qti-base-value base-type="string">x</qti-base-value>'),
            ),
            [
              setter,
              [
                "expression-type",
                "qti-lookup-outcome-value",
                "ITEM1.SCORE",
                "28",
                undefined,
                fileLocation(location, "test.xml"),
                { kind: "path", path: ruleAt("qti-lookup-outcome-value") },
              ],
            ],
          );
          assert.deepStrictEqual(
            lookupFacts(
              yield* openLookingUp('<qti-base-value base-type="integer">1</qti-base-value>'),
            ),
            [setter],
          );
        }),
    );

    it.effect(
      "[T-9] dotted lookup and pattern through the package: pattern {ITEM2.N}, an integer, is refused once as expression-type with check reference, pantry's P24, and {ITEM2.S}, a string, and {ITEM9.X}, a literal (ruling R1), are accepted",
      () =>
        Effect.gen(function* patternThroughPackage() {
          assert.deepStrictEqual(refusalsOf(yield* openMatching("{ITEM2.N}")), [
            {
              detail: {
                attribute: "pattern",
                check: "reference",
                element: "qti-pattern-match",
                expectedBaseType: "string",
                identifier: "ITEM2.N",
              },
              document: fileLocation(location, "test.xml"),
              location: { kind: "path", path: nullTestedAt("qti-pattern-match") },
              rule: "expression-type",
            },
          ]);
          acceptedOf(yield* openMatching("{ITEM2.S}"));
          acceptedOf(yield* openMatching("{ITEM9.X}"));
        }),
    );

    it.effect("refuses an item ref whose href resolves to no listed item resource", () =>
      Effect.gen(function* unresolved() {
        const verdict = yield* openPackage(
          location,
          packageOf({
            "items/a.xml": itemXml("a", "SCORE"),
            [manifestFile]: manifestXml(
              resourceXml("T", "imsqti_test_xmlv3p0", "tests/test.xml"),
              resourceXml("A", "imsqti_item_xmlv3p0", "items/a.xml"),
            ),
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
          missingReference(
            "qti-assessment-test/qti-test-part/qti-assessment-section/qti-assessment-item-ref[2]",
            "href",
            "tests/items/b.xml",
            "tests/test.xml",
          ),
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
              "items/img.png": "PNG",
              "items/q.html": itemXml("q", "SCORE"),
              [manifestFile]: manifestXml(
                resourceXml("T", "imsqti_test_xmlv3p0", "tests/test.xml"),
                '<resource identifier="Q" type="imsqti_item_xmlv3p0" href="items/q.html"><file href="items/q.html"/><file href="items/img.png"/></resource>',
                resourceXml("S", "imsqti_stimulus_xmlv3p0", "stimuli/s.xml"),
                resourceXml("W", "webcontent", "shared/page.html"),
              ),
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
              "items/a.xml": itemXml("a", "SCORE"),
              [manifestFile]: manifestXml(
                resourceXml("A", "imsqti_item_xmlv3p0", "items/a.xml"),
                resourceXml("O", "imsqti_outcomes_xmlv3p0", "shared/outcomes.xml"),
                '<resource identifier="R" type="imsqti_resprocessing_xmlv3p0" href="shared/rp.xml"><file href="shared/rp.xml"/><file href="shared/rp.css"/></resource>',
                resourceXml("RT", "imsqti_rptemplate_xmlv3p0", "shared/template.xml"),
                resourceXml("F", "imsqti_fragment_xmlv3p0", "shared/fragment.xml"),
              ),
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
              "items/a.png": "PNG",
              "items/a.xml": itemXml("a", "SCORE"),
              "items/q.html": `<qti-assessment-item xmlns="${qti}" identifier="q" title="q" adaptive="false" time-dependent="false"><qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier"><qti-correct-response><qti-value>A</qti-value></qti-correct-response></qti-response-declaration><qti-item-body><p>q</p></qti-item-body></qti-assessment-item>`,
              "items/q.png": "PNG",
              [manifestFile]: manifestXml(
                '<resource identifier="H" type="imsqti_item_xmlv3p0"><file href="items/q.html"/><file href="items/q.png"/></resource>',
                '<resource identifier="A" type="imsqti_item_xmlv3p0" href="items/a.xml"><file href="items/a.xml"/><file href="items/a.png"/></resource>',
              ),
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
      "align-54 hrefs and keys E17: a QTI document resource with an absolute href is refused package-path-outside, check document-entry, while a webcontent resource with one keeps every local file it lists",
      () =>
        Effect.gen(function* absoluteHref() {
          const remote = "https://example.org/items/r.xml";
          const packageTyped = (type: string) =>
            openPackage(
              location,
              packageOf({
                "items/a.png": "PNG",
                "items/a.xml": itemXml("a", "SCORE"),
                "items/r.png": "PNG",
                "items/r.xml": itemXml("r", "SCORE"),
                [manifestFile]: manifestXml(
                  `<resource identifier="R" type="${type}" href="${remote}"><file href="${remote}"/><file href="items/r.xml"/><file href="items/r.png"/></resource>`,
                  '<resource identifier="A" type="imsqti_item_xmlv3p0" href="items/a.xml"><file href="items/a.xml"/><file href="items/a.png"/></resource>',
                ),
              }),
            );

          assert.deepStrictEqual(refusalsOf(yield* packageTyped("imsqti_item_xmlv3p0")), [
            {
              detail: { check: "document-entry", path: remote, reading: "102" },
              document: fileLocation(location, manifestFile),
              location: { kind: "path", path: `${resourceAt(1)}/@href` },
              rule: "package-path-outside",
            },
          ]);

          const verdict = yield* packageTyped("webcontent");
          const accepted = acceptedOf(verdict);

          assert.isTrue(Option.isNone(resourceOf(verdict, "R").path));
          assert.deepStrictEqual(
            [...accepted.items.keys()],
            [fileLocation(location, "items/a.xml")],
          );
          assert.deepStrictEqual([...accepted.files].toSorted(), [
            "items/a.png",
            "items/r.png",
            "items/r.xml",
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

    it.effect(
      "refuses an item none of whose LOM identifier entries is its identifier as lom-identifier, at the LOM identifier (reading 62, \"an item's or test's identifier and title are those its package's LOM metadata gives it\")",
      () =>
        Effect.gen(function* lomIdentifier() {
          const open = (general: string) =>
            openPackage(
              location,
              packageOf({
                "items/a.xml": itemXml("a"),
                [manifestFile]: manifestXml(
                  describedXml("A", "imsqti_item_xmlv3p0", "items/a.xml", general),
                ),
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
      "refuses an item's and a test's LOM title that is not their title as lom-title (reading 62, \"an item's or test's identifier and title are those its package's LOM metadata gives it\")",
      () =>
        Effect.gen(function* lomTitles() {
          const verdict = yield* openPackage(
            location,
            packageOf({
              "items/a.xml": itemXml("a", "SCORE"),
              [manifestFile]: manifestXml(
                describedXml("T", "imsqti_test_xmlv3p0", "test.xml", lomTitle("Test", "Prüfung")),
                describedXml("A", "imsqti_item_xmlv3p0", "items/a.xml", lomTitle("Item A")),
              ),
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
      "opens a package whose LOM gives a matching entry and string, or no identifier or title, and passes over a stimulus's LOM (reading 62, \"an item's or test's identifier and title are those its package's LOM metadata gives it\")",
      () =>
        Effect.gen(function* lomOutside() {
          const verdict = yield* openPackage(
            location,
            packageOf({
              "items/a.xml": itemXml("a"),
              "items/b.xml": itemXml("b"),
              "items/c.xml": itemXml("c"),
              [manifestFile]: manifestXml(
                describedXml(
                  "A",
                  "imsqti_item_xmlv3p0",
                  "items/a.xml",
                  `${lomIdentifiers("x", " a\t")}${lomTitle("x", "a")}`,
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
              "passages/s.xml": `<qti-assessment-stimulus xmlns="${qti}" identifier="s" title="s"><qti-stimulus-body><p>s</p></qti-stimulus-body></qti-assessment-stimulus>`,
            }),
          );

          assert.lengthOf(acceptedOf(verdict).items, 3);
        }),
    );

    it.effect(
      "refuses metaData by both rules and CASEWithOutcome by lom-title at its one item (reading 62, \"an item's or test's identifier and title are those its package's LOM metadata gives it\")",
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
      { tags: ["corpus"] },
    );

    it.effect(
      "align-54 LOM languages D2: a title that matches only once its spaces collapse is refused lom-title, and one that matches once a tab reads as a space is not",
      () =>
        Effect.gen(function* lomTitleSpaces() {
          const open = (title: string, string: string) =>
            openPackage(
              location,
              packageOf({
                "items/a.xml": titledItemXml(title),
                [manifestFile]: manifestXml(
                  describedXml("A", "imsqti_item_xmlv3p0", "items/a.xml", lomTitle(string)),
                ),
              }),
            );

          assert.deepStrictEqual(refusalsOf(yield* open("Item A", " Item  A ")), [
            {
              detail: {
                metadata: "Item A",
                path: "items/a.xml",
                reading: "62",
                resource: "A",
                title: "Item A",
              },
              document: fileLocation(location, manifestFile),
              location: { kind: "path", path: `${generalAt(soleResource)}/${lomStep}title` },
              rule: "lom-title",
            },
          ]);
          assert.lengthOf(acceptedOf(yield* open("Item&#9;A", "Item A")).items, 1);
          assert.lengthOf(acceptedOf(yield* open("Item A", "Item&#10;A")).items, 1);
        }),
    );

    it.effect(
      "align-54 LOM languages D2: a title that matches only a string of another language is refused lom-title, naming the document's language and its first string in it",
      () =>
        Effect.gen(function* lomTitleLanguage() {
          const verdict = yield* openPackage(
            location,
            packageOf({
              "items/a.xml": titledItemXml("Item A", ' xml:lang="en-GB"'),
              [manifestFile]: manifestXml(
                describedXml(
                  "A",
                  "imsqti_item_xmlv3p0",
                  "items/a.xml",
                  `${languageStrings(["de", "Item A"], ["EN-gb", "Aufgabe A"], ["en", "Item A "])}<language>en-gb</language>`,
                ),
              ),
            }),
          );

          assert.deepStrictEqual(refusalsOf(verdict), [
            {
              detail: {
                language: "en-GB",
                metadata: "Aufgabe A",
                others: "2",
                path: "items/a.xml",
                reading: "62",
                resource: "A",
                title: "Item A",
              },
              document: fileLocation(location, manifestFile),
              location: { kind: "path", path: `${generalAt(soleResource)}/${lomStep}title` },
              rule: "lom-title",
            },
          ]);
        }),
    );

    it.effect(
      "align-54 LOM languages D2: a string with no language, or an empty one, matches whatever the document's language, and one whose language differs only in case matches",
      () =>
        Effect.gen(function* lomTitleUnstated() {
          const open = (string: readonly [string, string]) =>
            openPackage(
              location,
              packageOf({
                "items/a.xml": titledItemXml("Item A", ' xml:lang="en"'),
                [manifestFile]: manifestXml(
                  describedXml(
                    "A",
                    "imsqti_item_xmlv3p0",
                    "items/a.xml",
                    `${languageStrings(["de", "Aufgabe A"], string)}<language>en</language>`,
                  ),
                ),
              }),
            );

          assert.lengthOf(acceptedOf(yield* open(["", "Item A"])).items, 1);
          assert.lengthOf(acceptedOf(yield* open(["EN", "Item A"])).items, 1);

          const unstated = yield* openPackage(
            location,
            packageOf({
              "items/a.xml": titledItemXml("Item A", ' xml:lang="en"'),
              [manifestFile]: manifestXml(
                describedXml(
                  "A",
                  "imsqti_item_xmlv3p0",
                  "items/a.xml",
                  `${lomTitle("Aufgabe A", "Item A")}<language>en</language>`,
                ),
              ),
            }),
          );

          assert.lengthOf(acceptedOf(unstated).items, 1);
        }),
    );

    it.effect(
      "align-54 LOM languages D2: a root whose xml:lang lies outside its domain states no language, so a string of any language matches its title, while en refuses the same record",
      () =>
        Effect.gen(function* lomTitleOutOfDomain() {
          for (const [lang, rules] of [
            ["en_GB", []],
            ["en", ["lom-title"]],
          ] as const) {
            const verdict = yield* openDescribed(
              titledItemXml("Item A", ` xml:lang="${lang}"`),
              `${languageStrings(["de", "Item A"])}<language>${lang}</language>`,
            );

            assert.deepStrictEqual(
              refusedUnder(verdict, "lom-title").map((refusal) => refusal.rule),
              [...rules],
              lang,
            );
          }
        }),
    );

    it.effect(
      "align-54 LOM languages E34: an item writing xml:lang en whose record lists no language is refused document-lang at the general, and one listed only padded, or a body element's language not listed, is refused once for each language",
      () =>
        Effect.gen(function* documentLang() {
          const refusal = (language: string, listed: string): Seen => ({
            detail: { document: "items/a.xml", language, listed, reading: "134" },
            document: fileLocation(location, manifestFile),
            location: { kind: "path", path: generalAt(soleResource) },
            rule: "document-lang",
          });
          const cases = [
            [' xml:lang="en"', lomTitle("a"), [refusal("en", "")]],
            [
              ' xml:lang=" en "',
              `${lomTitle("a")}<language> en </language><language>EN</language>`,
              [],
            ],
            [
              ' xml:lang="en"',
              `${lomTitle("a")}<language> en </language><language>de</language>`,
              [refusal("en", " en  de")],
            ],
            [' xml:lang=""', lomTitle("a"), []],
            ["", lomTitle("a"), []],
          ] as const;
          for (const [lang, general, refusals] of cases) {
            const verdict = yield* openDescribed(titledItemXml("a", lang), general);

            assert.deepStrictEqual(refusedUnder(verdict, "document-lang"), [...refusals], lang);
          }

          const bodyLanguages = yield* openPackage(
            location,
            packageOf({
              "items/a.xml": `<qti-assessment-item xmlns="${qti}" identifier="a" title="a" adaptive="false" time-dependent="false" xml:lang="en"><qti-item-body><p xml:lang="fr">a</p><p xml:lang="FR">b</p><p xml:lang="en">c</p></qti-item-body></qti-assessment-item>`,
              [manifestFile]: manifestXml(
                describedXml("A", "imsqti_item_xmlv3p0", "items/a.xml", "<language>EN</language>"),
              ),
            }),
          );

          assert.deepStrictEqual(refusalsOf(bodyLanguages), [refusal("fr", "EN")]);
        }),
    );

    it.effect(
      "align-54 LOM languages E34: a test is judged as an item is, and a resource with no LOM general is not judged",
      () =>
        Effect.gen(function* documentLangTest() {
          const verdict = yield* openPackage(
            location,
            packageOf({
              "items/a.xml": titledItemXml("a", ' xml:lang="de"'),
              [manifestFile]: manifestXml(
                describedXml("T", "imsqti_test_xmlv3p0", "test.xml", "<language>de</language>"),
                resourceXml("A", "imsqti_item_xmlv3p0", "items/a.xml"),
              ),
              "test.xml": `<qti-assessment-test xmlns="${qti}" identifier="T" title="T"><qti-test-part identifier="P" navigation-mode="linear" submission-mode="individual"><qti-assessment-section identifier="S" title="S" visible="true"><qti-rubric-block use="instructions" view="candidate"><qti-content-body><p xml:lang="en">Read</p><p xml:lang="de">Lies</p></qti-content-body></qti-rubric-block><qti-assessment-item-ref identifier="a" href="items/a.xml"/></qti-assessment-section></qti-test-part></qti-assessment-test>`,
            }),
          );

          assert.deepStrictEqual(refusalsOf(verdict), [
            {
              detail: { document: "test.xml", language: "en", listed: "de", reading: "134" },
              document: fileLocation(location, manifestFile),
              location: { kind: "path", path: generalAt(resourceAt(1)) },
              rule: "document-lang",
            },
          ]);
        }),
    );

    it.effect(
      'align-54 R3 catalog languages F5: an item writing xml:lang en whose record lists only en is accepted when its card, a card entry, an HTML content or an element inside one states de, as catalog content is not among the elements reading 134 counts (R9-c, "R26 counts the metadata binding\'s elements, and catalog content is not among them")',
      () =>
        Effect.gen(function* catalogLanguages() {
          const cards = [
            '<qti-card support="glossary-on-screen" xml:lang="de"><qti-html-content><p>Wort</p></qti-html-content></qti-card>',
            '<qti-card support="glossary-on-screen"><qti-card-entry xml:lang="de" default="true"><qti-html-content><p>Wort</p></qti-html-content></qti-card-entry></qti-card>',
            '<qti-card support="glossary-on-screen"><qti-html-content xml:lang="de"><p>Wort</p></qti-html-content></qti-card>',
            '<qti-card support="glossary-on-screen"><qti-card-entry><qti-html-content><p xml:lang="de">Wort</p></qti-html-content></qti-card-entry></qti-card>',
          ];
          for (const card of cards) {
            const verdict = yield* openDescribed(
              catalogItemXml("", card),
              `${lomTitle("a")}<language>en</language>`,
            );

            assert.deepStrictEqual(refusalsOf(verdict), [], card);
            acceptedOf(verdict);
          }
        }),
    );

    it.effect(
      "align-54 R3 catalog languages F5, control: the same de on a body p beside the catalog is still refused document-lang at the general, once",
      () =>
        Effect.gen(function* catalogLanguagesControl() {
          const verdict = yield* openDescribed(
            catalogItemXml(
              ' xml:lang="de"',
              '<qti-card support="glossary-on-screen"><qti-html-content xml:lang="de"><p>Wort</p></qti-html-content></qti-card>',
            ),
            `${lomTitle("a")}<language>en</language>`,
          );

          assert.deepStrictEqual(refusalsOf(verdict), [
            {
              detail: { document: "items/a.xml", language: "de", listed: "en", reading: "134" },
              document: fileLocation(location, manifestFile),
              location: { kind: "path", path: generalAt(soleResource) },
              rule: "document-lang",
            },
          ]);
        }),
    );

    it.effect(
      "align-54 LOM languages E41a: a root with no title beside a LOM title, or no identifier beside a LOM identifier, even an empty one, is refused at the root",
      () =>
        Effect.gen(function* lomUnwritten() {
          const cases = [
            [' identifier="a"', lomTitle(""), [unwrittenAt("lom-title", "title")]],
            [' title="a"', lomIdentifiers(""), [unwrittenAt("lom-identifier", "identifier")]],
            [' identifier="a"', "", []],
          ] as const;
          for (const [attributes, general, refusals] of cases) {
            const verdict = yield* openDescribed(
              `<qti-assessment-item xmlns="${qti}"${attributes} adaptive="false" time-dependent="false"><qti-item-body><p>a</p></qti-item-body></qti-assessment-item>`,
              general,
            );

            assert.deepStrictEqual(
              refusedUnder(verdict, "lom-identifier", "lom-title"),
              [...refusals],
              attributes,
            );
          }
        }),
    );

    it.effect(
      "align-54 version seam P2: refuses a 3.0.0 package's item that holds a qti-custom-interaction, which the same item opened alone keeps (OD-A54-3)",
      () =>
        Effect.gen(function* customInPackage() {
          const files = packageOf({
            "items/custom.xml": customItemXml,
            [manifestFile]: manifestXml(
              resourceXml("CUSTOM", "imsqti_item_xmlv3p0", "items/custom.xml"),
            ),
          });
          const document = fileLocation(location, "items/custom.xml");
          const verdict = yield* openPackage(location, files);
          const alone = yield* openDocument(
            document,
            files.get("items/custom.xml") ?? new Uint8Array(),
          );

          assert.deepStrictEqual(
            documentVerdict(resourceOf(verdict, "CUSTOM")),
            Option.some("refused"),
          );
          assert.deepStrictEqual(refusalsOf(verdict), [
            {
              detail: {
                check: "custom-interaction",
                element: "qti-custom-interaction",
                parent: "qti-item-body",
                version: "3.0.0",
              },
              document,
              location: {
                kind: "path",
                path: "qti-assessment-item/qti-item-body/qti-custom-interaction",
              },
              rule: "unknown-element",
            },
          ]);
          assert.strictEqual(alone.verdict, "accepted-with-unsupported");
        }),
    );

    it.effect(
      "align-54 document roots E9: a usage-data or fragment resource whose document's root is in a namespace of QTI 2 is refused as not-qti-root at that document, read for its root alone; a usage-data root in QTI 3's namespace, and a usage-data document the reader cannot read, are passed over (reading 89 (\"a document whose root element is in a namespace of QTI 2 is not a QTI 3 document\"))",
      () =>
        Effect.gen(function* qti2Roots() {
          assert.deepStrictEqual(refusalsOf(yield* openUsageData(usageDataXml(qti2UsageData))), [
            notQti2Root("usageData", qti2UsageData),
          ]);
          assert.deepStrictEqual(
            refusalsOf(
              yield* openUsageData(
                '<assessmentItem xmlns="http://www.imsglobal.org/xsd/imsqti_v2p2" identifier="a" title="a" adaptive="false" timeDependent="false"/>',
                "imsqti_fragment_xmlv3p0",
              ),
            ),
            [notQti2Root("assessmentItem", "http://www.imsglobal.org/xsd/imsqti_v2p2")],
          );
          acceptedOf(
            yield* openUsageData(
              usageDataXml("http://www.imsglobal.org/xsd/imsqti_usagedata_v3p0"),
            ),
          );
          acceptedOf(yield* openUsageData(`<usageData xmlns="${qti2UsageData}">`));
        }),
    );

    it.effect(
      "align-54 document roots E38: a path two document types name is read as the first type in the manifest's order that its root bears out, and each resource of another type is refused as resource-type-mismatch with check path-type; where its root bears out neither, the first type's resource is refused for the root as well (reading 162 (\"a path two document types name is the document its root bears out\"))",
      () =>
        Effect.gen(function* oneTypePerPath() {
          const item = { "doc.xml": itemXml("d", "SCORE"), "items/a.xml": itemXml("a", "SCORE") };
          const processing = { "doc.xml": processingXml, "items/a.xml": itemXml("a", "SCORE") };

          assert.deepStrictEqual(
            refusalsOf(
              yield* openTwiceNamed(
                "imsqti_rptemplate_xmlv3p0",
                "imsqti_resprocessing_xmlv3p0",
                processing,
              ),
            ),
            [pathTyped(3, "imsqti_resprocessing_xmlv3p0", "doc.xml")],
          );

          const stimulusFirst = yield* openTwiceNamed(
            "imsqti_stimulus_xmlv3p0",
            "imsqti_item_xmlv3p0",
            item,
          );
          assert.deepStrictEqual(refusalsOf(stimulusFirst), [
            pathTyped(2, "imsqti_stimulus_xmlv3p0", "doc.xml"),
          ]);
          assert.deepStrictEqual(
            documentKind(resourceOf(stimulusFirst, "SECOND")),
            Option.some("item"),
          );
          assert.isTrue(Option.isNone(resourceOf(stimulusFirst, "FIRST").verdict));
          for (const other of [
            "resourcemetadata/xml",
            "qtiusagedata/xml",
            "imsqti_fragment_xmlv3p0",
          ]) {
            assert.deepStrictEqual(
              refusalsOf(yield* openTwiceNamed("imsqti_item_xmlv3p0", other, item)),
              [pathTyped(3, other, "doc.xml")],
            );
          }
          assert.deepStrictEqual(
            refusalsOf(
              yield* openTwiceNamed("imsqti_item_xmlv3p0", "resourcemetadata/xml", {
                "doc.xml": lomXml,
                "items/a.xml": itemXml("a", "SCORE"),
              }),
            ),
            [pathTyped(2, "imsqti_item_xmlv3p0", "doc.xml")],
          );
          assert.deepStrictEqual(
            refusalsOf(
              yield* openTwiceNamed("imsqti_outcomes_xmlv3p0", "imsqti_rptemplate_xmlv3p0", item),
            ),
            [
              {
                detail: {
                  expected: "imsqti_item_xmlv3p0",
                  path: "doc.xml",
                  root: "qti-assessment-item",
                  type: "imsqti_outcomes_xmlv3p0",
                },
                document: fileLocation(location, manifestFile),
                location: { kind: "path", path: resourceAt(2) },
                rule: "resource-type-mismatch",
              },
              pathTyped(3, "imsqti_rptemplate_xmlv3p0", "doc.xml"),
            ],
          );
          acceptedOf(yield* openTwiceNamed("imsqti_item_xmlv3p0", "imsqti_item_xmlv3p0", item));
        }),
    );

    it.effect(
      "align-54 document roots E38: a document resource whose href names imsmanifest.xml is refused as resource-type-mismatch with check manifest-document, and the manifest is never read again as its document; a web content resource or a file that names it is admitted (reading 146 (\"the manifest is the package's one document at imsmanifest.xml, and no resource's\"))",
      () =>
        Effect.gen(function* manifestNamed() {
          for (const type of [
            "imsqti_fragment_xmlv3p0",
            "resourcemetadata/xml",
            "qtiusagedata/xml",
            "imsqti_item_xmlv3p0",
            "imsqti_outcomes_xmlv3p0",
          ]) {
            const verdict = yield* openNamingManifest(type);

            assert.deepStrictEqual(refusalsOf(verdict), [
              {
                detail: { check: "manifest-document", path: manifestFile, reading: "146", type },
                document: fileLocation(location, manifestFile),
                location: { kind: "path", path: resourceAt(2) },
                rule: "resource-type-mismatch",
              },
            ]);
            assert.isTrue(Option.isNone(resourceOf(verdict, "M").verdict));
          }
          acceptedOf(yield* openNamingManifest("webcontent"));
        }),
    );

    it.effect(
      'align-54 file references E18: an item whose img src names no file the package holds is refused package-file-missing, check reference, at the src, whose path is resolved through the xml:base in scope; one naming a held file, an absolute URI, a path from a host\'s root, one that climbs out of the package or one that names its own document is accepted (reading 103 ("each one that resolves within the package names a file the manifest describes; an xml:base is a base"))',
      () =>
        Effect.gen(function* imageReferences() {
          const image = '<p><img src="images/a.png" alt="a"/></p>';

          assert.deepStrictEqual(refusalsOf(yield* openReferencing(bodyItemXml(image))), [
            missingReference(`${itemBody}/p/img`, "src", "items/images/a.png"),
          ]);
          acceptedOf(yield* openReferencing(bodyItemXml(image), { "items/images/a.png": "a" }));
          acceptedOf(
            yield* openReferencing(
              bodyItemXml(
                '<p><img src="https://example.org/a.png" alt="a"/><img src="/a.png" alt="b"/><img src="../../a.png" alt="c"/><a href="#top">d</a><a href="?q=1">e</a></p>',
              ),
            ),
          );

          const based = '<div xml:base="media/"><p><img src=" a.png " alt="a"/></p></div>';
          assert.deepStrictEqual(refusalsOf(yield* openReferencing(bodyItemXml(based))), [
            missingReference(`${itemBody}/div/p/img`, "src", "items/media/a.png"),
          ]);
          acceptedOf(yield* openReferencing(bodyItemXml(based), { "items/media/a.png": "a" }));
          acceptedOf(
            yield* openReferencing(
              bodyItemXml(
                '<div xml:base="https://example.org/media/"><p><img src="a.png" alt="a"/></p></div>',
              ),
            ),
          );
          assert.deepStrictEqual(
            refusalsOf(
              yield* openReferencing(
                bodyItemXml('<p><img xml:base="../shared/" src="a.png" alt="a"/></p>'),
              ),
            ),
            [missingReference(`${itemBody}/p/img`, "src", "shared/a.png")],
          );
        }),
    );

    it.effect(
      'align-54 file references E18: an item whose stylesheet href names no file the package holds is refused package-file-missing, check reference, at the href; held, it is accepted (reading 103 ("each one that resolves within the package names a file the manifest describes"))',
      () =>
        Effect.gen(function* stylesheetReference() {
          const item = bodyItemXml(
            "<p>a</p>",
            '<qti-stylesheet href="../styles/a.css" type="text/css"/>',
          );

          assert.deepStrictEqual(refusalsOf(yield* openReferencing(item)), [
            missingReference("qti-assessment-item/qti-stylesheet", "href", "styles/a.css"),
          ]);
          acceptedOf(yield* openReferencing(item, { "styles/a.css": "p {}" }));
        }),
    );

    it.effect(
      'align-54 file references E18: an item whose qti-interaction-modules primary-configuration names no file the package holds is refused package-file-missing, check reference, at the primary-configuration; held, it is accepted (reading 103 ("each one that resolves within the package names a file the manifest describes"))',
      () =>
        Effect.gen(function* configurationReference() {
          const item = configuredItemXml("modules/config.js");

          assert.deepStrictEqual(refusalsOf(yield* openReferencing(item)), [
            missingReference(
              `${itemBody}/qti-portable-custom-interaction/qti-interaction-modules`,
              "primary-configuration",
              "items/modules/config.js",
            ),
          ]);
          acceptedOf(yield* openReferencing(item, { "items/modules/config.js": "{}" }));
        }),
    );

    it.effect(
      'align-54 file references E18: a test\'s item ref whose href names no file the package holds is refused both item-ref-unresolved, naming no item, and package-file-missing, check reference, naming no file (reading 103 ("each one that resolves within the package names a file the manifest describes"))',
      () =>
        Effect.gen(function* itemRefReference() {
          const ref =
            "qti-assessment-test/qti-test-part/qti-assessment-section/qti-assessment-item-ref";

          assert.deepStrictEqual(
            refusalsOf(
              yield* openBasedTest("", ["../items/a.xml", "../items/b.xml"], ["items/a.xml"]),
            ),
            [
              {
                detail: { href: "../items/b.xml", identifier: "b", path: "items/b.xml" },
                document: fileLocation(location, "tests/t.xml"),
                location: { kind: "path", path: `${ref}[2]` },
                rule: "item-ref-unresolved",
              },
              missingReference(`${ref}[2]`, "href", "items/b.xml", "tests/t.xml"),
            ],
          );
        }),
    );

    it.effect(
      'align-54 file references E18: a test\'s item refs resolve through the xml:base in scope, so under a part whose xml:base names the items\' folder they name those items and none is item-ref-unresolved, and under an xml:base outside the package they name no path and no file reference is checked; the test is refused for the xml:base itself all the same, which no test element declares (reading 103 ("an xml:base is a base, resolved and never a file reference"); reading 90 ("an attribute its XSD does not declare is a data- attribute, or the document is refused"))',
      () =>
        Effect.gen(function* basedItemRefs() {
          const ref =
            "qti-assessment-test/qti-test-part/qti-assessment-section/qti-assessment-item-ref";
          const undeclaredBase: Seen = {
            detail: { attribute: "xml:base", element: "qti-test-part", reading: "90" },
            document: fileLocation(location, "tests/t.xml"),
            location: { kind: "path", path: "qti-assessment-test/qti-test-part/@xml:base" },
            rule: "unknown-attribute",
          };

          assert.deepStrictEqual(
            refusalsOf(yield* openBasedTest(' xml:base="../items/"', ["a.xml", "./b.xml"])),
            [undeclaredBase],
          );
          assert.deepStrictEqual(
            refusalsOf(
              yield* openBasedTest(' xml:base="https://example.org/items/"', ["a.xml", "b.xml"]),
            ),
            [
              ...[1, 2].map((index) => ({
                detail: {
                  href: index === 1 ? "a.xml" : "b.xml",
                  identifier: index === 1 ? "a" : "b",
                },
                document: fileLocation(location, "tests/t.xml"),
                location: { kind: "path" as const, path: `${ref}[${index}]` },
                rule: "item-ref-unresolved",
              })),
              undeclaredBase,
            ],
          );
        }),
    );

    it.effect(
      'align-54 R3 card files and icons F4: a card whose qti-file-href names images/missing.png, which the package neither holds nor lists, is refused package-file-missing, check reference, at the qti-file-href, its path resolved against the item\'s own; held and listed, it is accepted, and one whose text holds an unexpanded entity reference is not read (R9-b, "Card files and resource icons are file references": "these files MUST be contained in the corresponding QTI content package")',
      () =>
        Effect.gen(function* cardFile() {
          const item = cardItemXml(
            `<qti-card support="glossary-on-screen">${cardFileXml(" images/missing.png ")}</qti-card>`,
          );

          assert.deepStrictEqual(refusalsOf(yield* openReferencing(item)), [
            missingFile(
              "qti-assessment-item/qti-catalog-info/qti-catalog/qti-card/qti-file-href",
              "qti-file-href",
              "items/images/missing.png",
              cardFileSource,
            ),
          ]);
          acceptedOf(yield* openReferencing(item, { "items/images/missing.png": "a" }));
          assert.deepStrictEqual(
            refusalsOf(
              yield* openReferencing(
                `<!DOCTYPE qti-assessment-item SYSTEM "a.dtd">${cardItemXml(
                  `<qti-card support="glossary-on-screen">${cardFileXml("images/&missing;.png")}</qti-card>`,
                )}`,
              ),
            ),
            [],
          );
        }),
    );

    it.effect(
      'align-54 R3 card files and icons F4: a card entry whose second qti-file-href names a missing file is refused at that qti-file-href, and its first, naming a held file, is not; held, both are accepted (R9-b, "Card files and resource icons are file references")',
      () =>
        Effect.gen(function* cardEntryFile() {
          const item = cardItemXml(
            `<qti-card support="glossary-on-screen"><qti-card-entry default="true">${cardFileXml("images/a.png")}${cardFileXml("images/missing.png")}</qti-card-entry></qti-card>`,
          );

          assert.deepStrictEqual(
            refusalsOf(yield* openReferencing(item, { "items/images/a.png": "a" })),
            [
              missingFile(
                "qti-assessment-item/qti-catalog-info/qti-catalog/qti-card/qti-card-entry/qti-file-href[2]",
                "qti-file-href",
                "items/images/missing.png",
                cardFileSource,
              ),
            ],
          );
          acceptedOf(
            yield* openReferencing(item, {
              "items/images/a.png": "a",
              "items/images/missing.png": "a",
            }),
          );
        }),
    );

    it.effect(
      'align-54 R3 card files and icons F4: a card entry\'s qti-file-href under the entry\'s xml:base resolves through it, so media/ names items/media/a.png, and one under an xml:base outside the package names no path and is not looked for; the item is refused for the xml:base itself all the same, which a card entry\'s wildcard leaves to extensions (R9-b, "Card files and resource icons are file references"; reading 103 ("an xml:base is a base, resolved and never a file reference"); reading 90 ("an attribute its XSD does not declare is a data- attribute, or the document is refused"))',
      () =>
        Effect.gen(function* basedCardFile() {
          const entry = "qti-assessment-item/qti-catalog-info/qti-catalog/qti-card/qti-card-entry";
          const undeclaredBase: Seen = {
            detail: { attribute: "xml:base", element: "qti-card-entry", reading: "90" },
            document: fileLocation(location, "items/a.xml"),
            location: { kind: "path", path: `${entry}/@xml:base` },
            rule: "unknown-attribute",
          };

          assert.deepStrictEqual(refusalsOf(yield* openReferencing(basedCardItemXml("media/"))), [
            missingFile(
              `${entry}/qti-file-href`,
              "qti-file-href",
              "items/media/a.png",
              cardFileSource,
            ),
            undeclaredBase,
          ]);
          assert.deepStrictEqual(
            refusalsOf(
              yield* openReferencing(basedCardItemXml("media/"), { "items/media/a.png": "a" }),
            ),
            [undeclaredBase],
          );
          assert.deepStrictEqual(
            refusalsOf(yield* openReferencing(basedCardItemXml("https://example.org/media/"))),
            [undeclaredBase],
          );
        }),
    );

    it.effect(
      'align-54 R3 card files and icons F4: a digital material\'s qti-resource-icon naming a missing file is refused package-file-missing, check reference, at the qti-resource-icon; its own qti-file-href naming a missing file is left out and accepted, as is a calculator\'s; held, the icon is accepted (section 5.80.4, "This file MUST be contained within the correponding QTI content package"; R9-b, "The ItemFileInfo qti-file-href of a calculator or digital material is left out")',
      () =>
        Effect.gen(function* resourceIcon() {
          const item = cardItemXml(
            `<qti-card support="glossary-on-screen"><qti-html-content><p>a</p></qti-html-content></qti-card>`,
            materialXml("materials/missing.pdf", "icons/missing.png"),
          );

          assert.deepStrictEqual(refusalsOf(yield* openReferencing(item)), [
            missingFile(
              "qti-assessment-item/qti-companion-materials-info/qti-digital-material/qti-resource-icon",
              "qti-resource-icon",
              "items/icons/missing.png",
              iconSource,
            ),
          ]);
          acceptedOf(yield* openReferencing(item, { "items/icons/missing.png": "a" }));
        }),
    );

    it.effect(
      "align-54 file references E38: an item and a test resource that name one path both describe its document, so each one's LOM identifier is compared with the document's identifier, whatever type the document is read as (reading 162 (\"the records of each item or test resource that names the path still describe the document\"))",
      () =>
        Effect.gen(function* everyNamingResource() {
          const verdict = yield* openPackage(
            location,
            packageOf({
              "doc.xml": itemXml("a"),
              [manifestFile]: manifestXml(
                describedXml("I", "imsqti_item_xmlv3p0", "doc.xml", lomIdentifiers("a")),
                describedXml("T", "imsqti_test_xmlv3p0", "doc.xml", lomIdentifiers("other")),
              ),
            }),
          );

          assert.deepStrictEqual(refusalsOf(verdict), [
            pathTyped(2, "imsqti_test_xmlv3p0", "doc.xml"),
            {
              detail: {
                identifier: "a",
                metadata: "other",
                path: "doc.xml",
                reading: "62",
                resource: "T",
              },
              document: fileLocation(location, manifestFile),
              location: { kind: "path", path: `${generalAt(resourceAt(2))}/${lomStep}identifier` },
              rule: "lom-identifier",
            },
          ]);
        }),
    );
  });

  describe("openPackage, a document many resources name", () => {
    it.effect(
      "align-54 r11 LOM languages once finding 13c: two resources naming one item whose body states fr are each refused document-lang at their own general, the second from the language forms the first read, and a third naming it with no LOM record is not judged (reading 134)",
      () =>
        Effect.gen(function* sharedForms() {
          const refusal = (position: number): Seen => ({
            detail: { document: "items/a.xml", language: "fr", listed: "en", reading: "134" },
            document: fileLocation(location, manifestFile),
            location: { kind: "path", path: generalAt(resourceAt(position)) },
            rule: "document-lang",
          });
          const verdict = yield* openPackage(
            location,
            packageOf({
              "items/a.xml": titledItemXml("a", ' xml:lang="fr"'),
              [manifestFile]: manifestXml(
                describedXml(
                  "A1",
                  "imsqti_item_xmlv3p0",
                  "items/a.xml",
                  `${lomTitle("a")}<language>en</language>`,
                ),
                bareNamingXml("A2"),
                describedXml(
                  "A3",
                  "imsqti_item_xmlv3p0",
                  "items/a.xml",
                  `${lomTitle("a")}<language>en</language>`,
                ),
              ),
            }),
          );

          assert.deepStrictEqual(refusalsOf(verdict), [refusal(1), refusal(3)]);
        }),
    );

    it.effect(
      "align-54 r11 LOM languages once finding 13c: 8 times the resources naming an item of 8 times the spans open in under 32 times the time, as the item's language forms are read once, not once for each resource that names it",
      () =>
        Effect.gen(function* namingGrowth() {
          const fewer = namingPackage(fewerNamingResources, fewerNamingSpans, bareNamingXml);
          const more = namingPackage(
            fewerNamingResources * growthFactor,
            fewerNamingSpans * growthFactor,
            bareNamingXml,
          );
          assert.deepStrictEqual(refusalsOf(yield* openPackage(location, fewer)), []);

          const growth = yield* growthRatio(opening(fewer), opening(more));
          assert.isBelow(
            growth,
            growthLimit,
            `8 times the resources and spans took ${growth.toFixed(1)} times as long`,
          );
        }),
      growthTimeoutMs,
    );

    it.effect(
      "align-54 r11 LOM languages once finding 13c: 2,000 resources naming an item of 20,000 spans open in under twice the thread CPU of one resource naming it, whether no resource gives a LOM record or each gives a title the item matches",
      () =>
        Effect.gen(function* namingHostile() {
          const metadata = [
            ["with no LOM record", bareNamingXml],
            ["each with a LOM title", titledNamingXml],
          ] as const;
          for (const [described, resource] of metadata) {
            const one = namingPackage(1, hostileNamingSpans, resource);
            const many = namingPackage(hostileNamingResources, hostileNamingSpans, resource);
            acceptedOf(yield* openPackage(location, one));
            acceptedOf(yield* openPackage(location, many));

            let oneMs = Number.POSITIVE_INFINITY;
            let manyMs = Number.POSITIVE_INFINITY;
            for (let run = 0; run < growthRuns; run += 1) {
              oneMs = Math.min(oneMs, yield* cpuMillis(opening(one)));
              manyMs = Math.min(manyMs, yield* cpuMillis(opening(many)));
            }

            assert.isBelow(
              manyMs,
              namingCpuLimit * oneMs,
              `2,000 resources ${described} took ${(manyMs / oneMs).toFixed(1)} times the CPU of one`,
            );
          }
        }),
      growthTimeoutMs,
    );
  });

  describe("openPackage, a deep xml:base", () => {
    it.effect(
      "align-54 r11 bases shared finding 13b: resolveIn names, against a document's directory, the path resolveInside names against the document's path, for every reference of a table of dot segments, a last dot segment, empty segments, escaped dots, slashes and spaces, a query and a fragment, a path from a host's root and a climb above the package's root (reading 102)",
      () =>
        Effect.sync(() => {
          const bases = ["a.xml", "items/a.xml", "items/sub/a.xml", "items/a//b.xml"];
          const references = [
            "x.png",
            "./x.png",
            "../x.png",
            "../../x.png",
            "../../../x.png",
            "sub/../x.png",
            "a/b/c/../../d.png",
            "sub/",
            "sub/.",
            "sub/..",
            "./",
            "../",
            ".",
            "..",
            "",
            "a//b.png",
            "%2E%2E/x.png",
            "%2e/x.png",
            "a%2Fb.png",
            "a%20b.png",
            "%E0%A4%A.png",
            "x.png?q=1#f",
            "?q",
            "#f",
            "/x.png",
          ];
          for (const base of bases) {
            for (const reference of references) {
              assert.deepStrictEqual(
                Option.map(resolveIn(directoryOf(base), reference), pathOf),
                Option.map(resolveInside(base.split("/"), reference), (segments) =>
                  segments.join("/"),
                ),
                `${reference} against ${base}`,
              );
            }
          }
        }),
    );

    it.effect(
      "align-54 r11 bases shared finding 13b: under a deep xml:base an image naming a held file is accepted, through a .. too, and one naming no file is refused package-file-missing with its path bounded: a path of 1,024 characters is given whole, and one of 1,025 or 4,011 keeps its first 512 and its last 511 characters around one … (U+2026)",
      () =>
        Effect.gen(function* boundedPaths() {
          const deep = "a/".repeat(2000);
          const deepPath = `items/${deep}x.png`;

          assert.deepStrictEqual(
            refusalsOf(
              yield* openReferencing(basedItemXml(deep, "held.png", "../up.png", "x.png"), {
                [`items/${deep}held.png`]: "a",
                [`items/${"a/".repeat(1999)}up.png`]: "a",
              }),
            ),
            [missingReference(basedImageAt(3), "src", boundedAs(deepPath))],
          );
          assert.lengthOf(boundedAs(deepPath), 1024);
          assert.include(boundedAs(deepPath), "…");

          const edge = "a/".repeat(506);
          assert.deepStrictEqual(
            refusalsOf(yield* openReferencing(basedItemXml(edge, "xy.png", "xyz.png"))),
            [
              missingReference(basedImageAt(1), "src", `items/${edge}xy.png`),
              missingReference(basedImageAt(2), "src", boundedAs(`items/${edge}xyz.png`)),
            ],
          );
          assert.lengthOf(`items/${edge}xy.png`, 1024);
          assert.notInclude(boundedAs(`items/${edge}xy.png`), "…");
          assert.include(boundedAs(`items/${edge}xyz.png`), "…");
        }),
    );

    it.effect(
      "align-54 r11 bases shared finding 13b: 8 times the segments of a deep xml:base and 8 times the images under it open in under 32 times the time, whether the images share the one base or each resolves a base of its own against it, as each reference resolves against its base's directory without copying it",
      () =>
        Effect.gen(function* sharedBaseGrowth() {
          const basings: readonly Basing[] = ["one base", "a base of its own"];
          for (const basing of basings) {
            const fewer = deepBasePackage(fewerBaseSegments, fewerBasedImages, basing);
            const more = deepBasePackage(
              fewerBaseSegments * growthFactor,
              fewerBasedImages * growthFactor,
              basing,
            );
            assert.lengthOf(refusalsOf(yield* openPackage(location, fewer)), fewerBasedImages);

            const growth = yield* growthRatio(opening(fewer), opening(more));
            assert.isBelow(
              growth,
              growthLimit,
              `8 times the segments and images under ${basing} took ${growth.toFixed(1)} times as long`,
            );
          }
        }),
      growthTimeoutMs,
    );

    it.effect(
      "align-54 r11 bases shared finding 13b: 5,000 images under an xml:base of 50,000 segments open in under twice the thread CPU of 5,000 images under an xml:base of one",
      () =>
        Effect.gen(function* sharedBaseHostile() {
          const shallow = deepBasePackage(1, hostileBasedImages);
          const deep = deepBasePackage(hostileBaseSegments, hostileBasedImages);
          assert.lengthOf(refusalsOf(yield* openPackage(location, shallow)), hostileBasedImages);
          assert.lengthOf(refusalsOf(yield* openPackage(location, deep)), hostileBasedImages);

          let shallowMs = Number.POSITIVE_INFINITY;
          let deepMs = Number.POSITIVE_INFINITY;
          for (let run = 0; run < growthRuns; run += 1) {
            shallowMs = Math.min(shallowMs, yield* cpuMillis(opening(shallow)));
            deepMs = Math.min(deepMs, yield* cpuMillis(opening(deep)));
          }

          assert.isBelow(
            deepMs,
            basesCpuLimit * shallowMs,
            `the deep base took ${(deepMs / shallowMs).toFixed(1)} times the CPU of the shallow one`,
          );
        }),
      growthTimeoutMs,
    );

    it.effect(
      "align-54 r11 bases shared finding 13b: the verdict on 10,000 images under an xml:base of 200,000 segments serialises, every refusal's path at most 1,024 characters and holding the …",
      () =>
        Effect.gen(function* serialisedRefusals() {
          const verdict = yield* openPackage(
            location,
            deepBasePackage(serialisedBaseSegments, serialisedBasedImages),
          );
          const named = refusalsOf(verdict).map(({ detail }) => detail["path"] ?? "");

          assert.isString(JSON.stringify(verdict));
          assert.lengthOf(named, serialisedBasedImages);
          assert.deepStrictEqual(
            new Set(named),
            new Set([boundedAs(`items/${"a/".repeat(serialisedBaseSegments)}x.png`)]),
          );
          for (const text of named) {
            assert.isAtMost(text.length, 1024);
            assert.include(text, "…");
          }
        }),
      growthTimeoutMs,
    );

    it.effect(
      "align-54 r11 bases shared finding 13c, a document's root read once: 8 times the resources naming an item whose root writes 8 times the attributes open in under 32 times the time, as the root's identifier, title and language are read once for the item, not once for each resource whose LOM record compares them",
      () =>
        Effect.gen(function* rootGrowth() {
          const fewer = rootPackage(fewerRootResources, fewerRootAttributes);
          const more = rootPackage(
            fewerRootResources * growthFactor,
            fewerRootAttributes * growthFactor,
          );
          assert.deepStrictEqual(refusalsOf(yield* openPackage(location, fewer)), []);

          const growth = yield* growthRatio(opening(fewer), opening(more));
          assert.isBelow(
            growth,
            growthLimit,
            `8 times the resources and attributes took ${growth.toFixed(1)} times as long`,
          );
        }),
      growthTimeoutMs,
    );
  });

  describe("openPackage, a section document many parts place", () => {
    it.effect(
      'align-54 r11 placements judged once finding 10: a section document U placed under one part through S0, which that part places twice, and under another part directly reads I0.SCORE from inside S0 under the first, accepted, and from outside S0 under the second, so the package is refused ambiguous-reference at U, as it is when one part places U both ways; placed by the first part alone, it is accepted (reading 86 ("a section document a test places twice is written once"))',
      () =>
        Effect.gen(function* placementsReadApart() {
          const ambiguous: Seen = {
            detail: {
              firstPrefix: "I0",
              firstVariable: "SCORE",
              reading: "86",
              reference: "I0.SCORE",
              secondPrefix: "I0",
              secondVariable: "SCORE",
            },
            document: fileLocation(location, "sections/u.xml"),
            location: {
              kind: "path",
              path: "qti-assessment-section/qti-assessment-item-ref/qti-pre-condition/qti-gt/qti-variable/@identifier",
            },
            rule: "ambiguous-reference",
          };
          // Closes the part that places S0 twice and opens a second, which places U directly.
          const otherPart = `</qti-test-part><qti-test-part identifier="P2" navigation-mode="linear" submission-mode="individual">${sectionRefXml("R3", "sections/u.xml")}`;

          acceptedOf(yield* openPackage(location, holdingFiles("")));
          assert.deepStrictEqual(
            refusalsOf(yield* openPackage(location, holdingFiles(otherPart))),
            [ambiguous],
          );
          assert.deepStrictEqual(
            refusalsOf(
              yield* openPackage(location, holdingFiles(sectionRefXml("R3", "sections/u.xml"))),
            ),
            [ambiguous],
          );
        }),
    );

    it.effect(
      "align-54 r11 placements judged once finding 10: 8 times the parts, each placing one section document whose item ref holds 8 times the dotted pre-conditions, open in under 32 times the time, as the document's references and processing are judged once for every part that places it alike",
      () =>
        Effect.gen(function* placingGrowth() {
          const fewer = placingPackage(fewerPlacingParts, "a part each");
          const more = placingPackage(fewerPlacingParts * growthFactor, "a part each");
          assert.deepStrictEqual(refusalsOf(yield* openPackage(location, fewer)), []);

          const growth = yield* growthRatio(opening(fewer), opening(more));
          assert.isBelow(
            growth,
            growthLimit,
            `8 times the parts and pre-conditions took ${growth.toFixed(1)} times as long`,
          );
        }),
      growthTimeoutMs,
    );

    it.effect(
      "align-54 r12 assembly limit finding 10: 640 parts, each placing one section document whose item ref holds 640 dotted pre-conditions, are refused assembly-limit naming the bytes bound, in under the thread CPU of the same 640 section refs in one part, which opens within the limit with no refusal",
      () =>
        Effect.gen(function* placingRefused() {
          const one = placingPackage(hostilePlacingParts, "one part");
          const many = placingPackage(hostilePlacingParts, "a part each");
          assert.deepStrictEqual(refusalsOf(yield* openPackage(location, one)), []);

          let oneMs = Number.POSITIVE_INFINITY;
          for (let run = 0; run < growthRuns; run += 1) {
            oneMs = Math.min(oneMs, yield* cpuMillis(opening(one)));
          }

          yield* refusedFast(
            many,
            limitRefused("bytes", bytesReached(many.get("sections/s2.xml")?.byteLength ?? 0)),
            oneMs,
          );
        }),
      growthTimeoutMs,
    );
  });

  describe("openPackage, item refs under a deep xml:base", () => {
    it.effect(
      "align-54 r11 placements judged once finding 13b, item refs under a deep base: an item ref naming the item the manifest lists under a deep xml:base resolves, and one naming no listed document is refused item-ref-unresolved with its path bounded: a path of 1,024 characters is given whole, and one of 1,025 or 4,011 keeps its first 512 and its last 511 characters around one … (U+2026)",
      () =>
        Effect.gen(function* boundedRefPaths() {
          const deep = "a/".repeat(2000);
          const deepPath = `tests/${deep}x.xml`;

          assert.deepStrictEqual(yield* unresolvedUnder(deep, ["held.xml", "x.xml"]), [
            unresolvedBasedRef(2, "x.xml", boundedAs(deepPath)),
          ]);
          assert.lengthOf(boundedAs(deepPath), 1024);
          assert.include(boundedAs(deepPath), "…");

          const edge = "a/".repeat(506);
          assert.deepStrictEqual(yield* unresolvedUnder(edge, ["xy.xml", "xyz.xml", "held.xml"]), [
            unresolvedBasedRef(1, "xy.xml", `tests/${edge}xy.xml`),
            unresolvedBasedRef(2, "xyz.xml", boundedAs(`tests/${edge}xyz.xml`)),
          ]);
          assert.lengthOf(`tests/${edge}xy.xml`, 1024);
          assert.include(boundedAs(`tests/${edge}xyz.xml`), "…");
        }),
    );

    it.effect(
      "align-54 r11 placements judged once finding 13b, item refs under a deep base: 8 times the segments of a test part's xml:base and 8 times the item refs under it open in under 32 times the time, whether each names the item listed there or no listed document, as each ref is looked for from its base's directory without its path written out",
      () =>
        Effect.gen(function* deepRefsGrowth() {
          const namings: readonly RefNaming[] = ["a listed item", "no listed document"];
          for (const naming of namings) {
            const fewer = deepRefsPackage(fewerRefSegments, fewerBasedRefs, naming);
            const more = deepRefsPackage(
              fewerRefSegments * growthFactor,
              fewerBasedRefs * growthFactor,
              naming,
            );
            assert.lengthOf(
              refusedUnder(yield* openPackage(location, fewer), "item-ref-unresolved"),
              naming === "a listed item" ? 0 : fewerBasedRefs,
            );

            const growth = yield* growthRatio(opening(fewer), opening(more));
            assert.isBelow(
              growth,
              growthLimit,
              `8 times the segments and item refs naming ${naming} took ${growth.toFixed(1)} times as long`,
            );
          }
        }),
      growthTimeoutMs,
    );

    it.effect(
      "align-54 r11 placements judged once finding 13b, item refs under a deep base: the verdict on 10,000 item refs under an xml:base of 200,000 segments serialises, every item-ref-unresolved path at most 1,024 characters and holding the …",
      () =>
        Effect.gen(function* serialisedRefs() {
          const verdict = yield* openPackage(
            location,
            deepRefsPackage(serialisedRefSegments, serialisedBasedRefs, "no listed document"),
          );
          const named = refusedUnder(verdict, "item-ref-unresolved").map(
            ({ detail }) => detail["path"] ?? "",
          );

          assert.isString(JSON.stringify(verdict));
          assert.lengthOf(named, serialisedBasedRefs);
          assert.deepStrictEqual(
            new Set(named),
            new Set([boundedAs(`tests/${"a/".repeat(serialisedRefSegments)}x.xml`)]),
          );
          for (const text of named) {
            assert.isAtMost(text.length, 1024);
            assert.include(text, "…");
          }
        }),
      growthTimeoutMs,
    );
  });

  describe("openPackage, refusals many placements give", () => {
    it.effect(
      "align-54 r11 held refusals indexed finding 12: 8 times the section documents, each writing the section identifier X, open in under 32 times the time, every one after the first refused duplicate-identifier once, as the refusals given so far are counted once across the placements, not again at each",
      () =>
        Effect.gen(function* heldGrowth() {
          const fewer = repeatingPackage(fewerRepeatingDocuments);
          const more = repeatingPackage(fewerRepeatingDocuments * growthFactor);
          assert.deepStrictEqual(
            refusalsOf(yield* openPackage(location, fewer)),
            Array.from({ length: fewerRepeatingDocuments - 1 }, (_, index) =>
              duplicateIn(`sections/s${index + 1}.xml`, "qti-assessment-section", "X"),
            ),
          );

          const growth = yield* growthRatio(opening(fewer), opening(more));
          assert.isBelow(
            growth,
            growthLimit,
            `8 times the section documents took ${growth.toFixed(1)} times as long`,
          );
        }),
      growthTimeoutMs,
    );

    it.effect(
      'align-54 r11 held refusals indexed finding 12: 100 section documents some 1,000 characters deep, each with 20 section refs back to the first, open within the default timeout, each ref refused inclusion-cycle once, its chain the documents from the test bounded to at most 1,024 characters, its first 512 and its last 511 around one … (U+2026) (reading 85 ("an inclusion never reaches itself"))',
      () =>
        Effect.gen(function* boundedCycles() {
          const verdict = yield* openPackage(location, cyclingPackage(hostileCyclingDocuments));
          const expected = new Map(
            Array.from({ length: hostileCyclingDocuments }, (_, index) => [
              fileLocation(location, cyclingAt(index)),
              boundedAs(cyclingChain(index)),
            ]),
          );
          const refused = refusalsOf(verdict);
          const perDocument = new Map<string, number>();

          assert.lengthOf(refused, hostileCyclingDocuments * cyclingRefsBack);
          for (const { detail, document, rule } of refused) {
            const chain = detail["chain"] ?? "";
            perDocument.set(document, (perDocument.get(document) ?? 0) + 1);

            assert.strictEqual(rule, "inclusion-cycle");
            assert.strictEqual(chain, expected.get(document), document);
            assert.isAtMost(chain.length, 1024);
            assert.include(chain, "…");
          }

          assert.deepStrictEqual(
            [...perDocument.values()],
            Array.from({ length: hostileCyclingDocuments }, () => cyclingRefsBack),
          );
          assert.isString(JSON.stringify(verdict));
        }),
    );
  });

  describe("openPackage, branch rules whose target many documents write", () => {
    it.effect(
      "align-54 r11 branch writers indexed finding 11: 8 times the section documents, each writing the section identifier X, and 8 times the item refs whose branch rule targets X open in under 32 times the time, each rule refused branch-target ambiguous once, as each target's writers and reach are indexed once, not again for each rule",
      () =>
        Effect.gen(function* branchingGrowth() {
          const fewer = branchingPackage(fewerBranchingDocuments, "every document");
          const more = branchingPackage(fewerBranchingDocuments * growthFactor, "every document");
          assert.deepStrictEqual(
            refusalsOf(yield* openPackage(location, fewer)),
            branchingRefusals(fewerBranchingDocuments, "every document"),
          );

          const growth = yield* growthRatio(opening(fewer), opening(more));
          assert.isBelow(
            growth,
            growthLimit,
            `8 times the section documents and rules took ${growth.toFixed(1)} times as long`,
          );
        }),
      growthTimeoutMs,
    );

    it.effect(
      'align-54 r11 branch writers indexed finding 11: 2,000 section documents each writing X and 2,000 item refs whose branch rule targets X open in under twice the thread CPU of the same package with X written once, each rule refused branch-target ambiguous there and unknown here (reading 87 ("from outside a section document a ref places, no target lies inside it"))',
      () =>
        Effect.gen(function* branchingHostile() {
          const once = branchingPackage(hostileBranchingDocuments, "the first document");
          const every = branchingPackage(hostileBranchingDocuments, "every document");
          assert.deepStrictEqual(
            refusalsOf(yield* openPackage(location, once)),
            branchingRefusals(hostileBranchingDocuments, "the first document"),
          );
          assert.deepStrictEqual(
            refusalsOf(yield* openPackage(location, every)),
            branchingRefusals(hostileBranchingDocuments, "every document"),
          );

          let onceMs = Number.POSITIVE_INFINITY;
          let everyMs = Number.POSITIVE_INFINITY;
          for (let run = 0; run < growthRuns; run += 1) {
            onceMs = Math.min(onceMs, yield* cpuMillis(opening(once)));
            everyMs = Math.min(everyMs, yield* cpuMillis(opening(every)));
          }

          assert.isBelow(
            everyMs,
            branchingCpuLimit * onceMs,
            `X written by every document took ${(everyMs / onceMs).toFixed(1)} times the CPU of X written once`,
          );
        }),
      growthTimeoutMs,
    );
  });

  describe("openPackage, branch rules whose distinct targets each document writes its own of", () => {
    it.effect(
      "align-54 r11 branch writers indexed finding 11: 8 times the section documents, each placed 16 times and writing a target of its own, and 8 times the branch rules, each to its own target, open in under 32 times the time, with the rules in the test and in a section document below every target's writer, as no walk of every placement is made for each target",
      () =>
        Effect.gen(function* distinctTargetsGrowth() {
          for (const rulesIn of ["the test", "a section document"] as const) {
            const fewer = targetsPackage(fewerTargetDocuments, "each its own", rulesIn);
            const more = targetsPackage(
              fewerTargetDocuments * growthFactor,
              "each its own",
              rulesIn,
            );
            assert.deepStrictEqual(
              refusalsOf(yield* openPackage(location, fewer)),
              targetsRefusals(fewerTargetDocuments, "each its own", rulesIn),
            );

            const growth = yield* growthRatio(opening(fewer), opening(more));
            assert.isBelow(
              growth,
              growthLimit,
              `with the rules in ${rulesIn}, 8 times the section documents and rules took ${growth.toFixed(1)} times as long`,
            );
          }
        }),
      growthTimeoutMs,
    );

    it.effect(
      "align-54 r12 assembly limit finding 11: 1,000 branch rules, each to the target its own section document writes, each document placed 16 times by 8 parts, are refused assembly-limit naming the placements bound, in under the thread CPU of the same package placed by one part, which opens within the limit, with the rules in the test and in a section document below every target's writer",
      () =>
        Effect.gen(function* distinctTargetsRefused() {
          for (const rulesIn of ["the test", "a section document"] as const) {
            const one = targetsPackage(hostileTargetDocuments, "each its own", rulesIn, 1);
            let oneMs = Number.POSITIVE_INFINITY;
            for (let run = 0; run < growthRuns; run += 1) {
              oneMs = Math.min(oneMs, yield* cpuMillis(opening(one)));
            }

            yield* refusedFast(
              targetsPackage(hostileTargetDocuments, "each its own", rulesIn),
              limitRefused("placements", "2049"),
              oneMs,
            );
          }
        }),
      growthTimeoutMs,
    );
  });

  describe("openPackage, a test that reads through every document a hub places", () => {
    it.effect(
      'align-54 r12 views without per-path sets: a section document U that S0 places, its pre-condition reading I0.SCORE through S0\'s item ref, reads S0 from inside when the part places S0 twice, under a drawn order and not, and the test reaches U only through one of the two, accepted; placed by the part directly too, or through a section of its own, U is reached through neither, so it reads S0 from outside as well and is refused ambiguous-reference at U (reading 86 ("a section document a test places twice is written once"))',
      () =>
        Effect.gen(function* viewsAround() {
          const ambiguous: Seen = {
            detail: {
              firstPrefix: "I0",
              firstVariable: "SCORE",
              reading: "86",
              reference: "I0.SCORE",
              secondPrefix: "I0",
              secondVariable: "SCORE",
            },
            document: fileLocation(location, "sections/u.xml"),
            location: {
              kind: "path",
              path: "qti-assessment-section/qti-assessment-item-ref/qti-pre-condition/qti-gt/qti-variable/@identifier",
            },
            rule: "ambiguous-reference",
          };

          acceptedOf(yield* openPackage(location, aroundFiles("")));
          for (const more of [
            sectionRefXml("R3", "sections/u.xml"),
            `<qti-assessment-section identifier="SC" title="SC" visible="true">${sectionRefXml("R3", "sections/u.xml")}</qti-assessment-section>`,
          ]) {
            assert.deepStrictEqual(refusalsOf(yield* openPackage(location, aroundFiles(more))), [
              ambiguous,
            ]);
          }
        }),
    );

    it.effect(
      "align-54 r12 views without per-path sets: 8 times the section documents a hub places under each of 2 parts, each read through by the test's outcome processing, open in under 32 times the time, as whether the test reaches the placement judged through no placement of a document is decided from the placements above it, not from a set of every placement kept for each document read",
      () =>
        Effect.gen(function* hubGrowth() {
          const fewer = hubPackage(fewerHubDocuments, "each document's item", hubGrowthParts);
          const more = hubPackage(
            fewerHubDocuments * growthFactor,
            "each document's item",
            hubGrowthParts,
          );
          assert.deepStrictEqual(
            refusalsOf(yield* openPackage(location, fewer)),
            hubRefusals(fewerHubDocuments),
          );

          const growth = yield* growthRatio(opening(fewer), opening(more));
          assert.isBelow(
            growth,
            growthLimit,
            `8 times the documents and reads took ${growth.toFixed(1)} times as long`,
          );
        }),
      growthTimeoutMs,
    );

    it.effect(
      "align-54 r12 assembly limit F17-A: 2,000 section documents a hub places under each of 64 parts, each read through by the test's outcome processing, are refused assembly-limit naming the placements bound, in under the thread CPU of the same package with one part, which opens within the limit",
      () =>
        Effect.gen(function* hubRefused() {
          const one = hubPackage(hostileHubDocuments, "each document's item", 1);
          let oneMs = Number.POSITIVE_INFINITY;
          for (let run = 0; run < growthRuns; run += 1) {
            oneMs = Math.min(oneMs, yield* cpuMillis(opening(one)));
          }

          yield* refusedFast(
            hubPackage(hostileHubDocuments, "each document's item"),
            limitRefused("placements", "2049"),
            oneMs,
          );
        }),
      growthTimeoutMs,
    );
  });

  describe("openPackage, branch rules below a long chain from two placements of their targets' writer", () => {
    it.effect(
      "align-54 r12 branch fallback without per-target sets: branch rules in a section document that a chain of 70 section documents places below two placements of the document that writes their targets, one under a drawn order, are each refused backward alone when the test reaches the rules only through those placements, and ambiguous and backward when the part places the chain's first or a middle document too, as the walk up from the rules' placement settles past 64 section refs both ways (reading 87 (\"one that two placements of a section document supply twice ... is refused as ambiguous\"))",
      () =>
        Effect.gen(function* layeredBothWays() {
          for (const aimed of ["each its own", "one"] as const) {
            assert.deepStrictEqual(
              refusalsOf(yield* openPackage(location, layeredPackage(2, aimed, 2, 2))),
              layeredRefusals(2, aimed, ["backward"]),
            );
            for (const more of [
              sectionRefXml("RC0", "sections/c1.xml"),
              `<qti-assessment-section identifier="SC" title="SC" visible="true">${sectionRefXml("RC0", "sections/c40.xml")}</qti-assessment-section>`,
            ]) {
              assert.deepStrictEqual(
                refusalsOf(yield* openPackage(location, layeredPackage(2, aimed, 2, 2, more))),
                layeredRefusals(2, aimed, ["ambiguous", "backward"]),
              );
            }
          }
        }),
    );

    it.effect(
      "align-54 r12 branch fallback without per-target sets: 8 times the branch rules, each to its own target, and 8 times the section documents a hub places under each of 2 parts, beside rules below a chain of 70 section documents from two placements of their targets' writer, open in under 32 times the time, as the walk up from the rules' placement settles each target without a set of every placement kept for it",
      () =>
        Effect.gen(function* layeredGrowth() {
          const fewer = layeredPackage(fewerLayered, "each its own", layeredParts, fewerLayered);
          const more = layeredPackage(
            fewerLayered * growthFactor,
            "each its own",
            layeredParts,
            fewerLayered * growthFactor,
          );
          assert.deepStrictEqual(
            refusalsOf(yield* openPackage(location, fewer)),
            layeredRefusals(fewerLayered, "each its own", ["backward"]),
          );

          const growth = yield* growthRatio(opening(fewer), opening(more));
          assert.isBelow(
            growth,
            growthLimit,
            `8 times the rules and documents took ${growth.toFixed(1)} times as long`,
          );
        }),
      growthTimeoutMs,
    );

    it.effect(
      "align-54 r12 assembly limit F17-B: 2,000 branch rules, each to its own target, below a chain of 70 section documents from two placements of their targets' writer, beside 1,000 section documents a hub places under each of 128 parts, are refused assembly-limit naming the placements bound, in under the thread CPU of the same package with the hub under one part, which opens within the limit",
      () =>
        Effect.gen(function* layeredRefused() {
          const one = layeredPackage(
            hostileLayeredTargets,
            "each its own",
            1,
            hostileLayeredDocuments,
          );
          let oneMs = Number.POSITIVE_INFINITY;
          for (let run = 0; run < growthRuns; run += 1) {
            oneMs = Math.min(oneMs, yield* cpuMillis(opening(one)));
          }

          yield* refusedFast(
            layeredPackage(
              hostileLayeredTargets,
              "each its own",
              hostileLayeredParts,
              hostileLayeredDocuments,
            ),
            limitRefused("placements", "2049"),
            oneMs,
          );
        }),
      growthTimeoutMs,
    );
  });

  describe("openPackage, the assembly limit across a package's tests", () => {
    it.effect.each(familyMembers)(
      "align-54 r12 assembly limit $id: $name, one step past the $bound bound, is refused assembly-limit naming it, with no test judged, in under 100 ms of thread CPU",
      ({ bound, past }) => {
        const files = past();

        return refusedFast(
          files,
          limitRefused(
            bound,
            bound === "bytes" ? bytesReached(files.get("sections/s.xml")?.byteLength ?? 0) : "2049",
          ),
          pastLimitMs,
        );
      },
      growthTimeoutMs,
    );

    it.effect.each(familyMembers)(
      "align-54 r12 assembly limit $id: $name, at the largest size the bounds admit, opens within them in under 2 s of thread CPU, the heap growing by under 512 MiB",
      ({ at }) =>
        Effect.gen(function* withinLimit() {
          const files = at();
          const before = memoryUsage().heapUsed;
          const first = yield* cpuMillis(opening(files));
          const grown = memoryUsage().heapUsed - before;
          const fastest = Math.min(first, yield* cpuMillis(opening(files)));
          assert.isBelow(
            fastest,
            withinLimitMs,
            `the package took ${fastest.toFixed(0)} ms of thread CPU`,
          );
          assert.isBelow(
            grown,
            withinLimitHeap,
            `the heap grew by ${(grown / 2 ** 20).toFixed(0)} MiB while the package opened`,
          );
        }),
      growthTimeoutMs,
    );

    it.effect(
      "align-54 r12 assembly limit: two tests whose placements sum to 2,048 are accepted, and to 2,049 refused naming the placements bound, whichever the manifest lists first, the limit counted across a package's tests",
      () =>
        Effect.gen(function* acrossTests() {
          for (const order of ["first", "second"] as const) {
            acceptedOf(yield* openPackage(location, twoTestsPackage(false, order)));
            assert.deepStrictEqual(
              refusalsOf(yield* openPackage(location, twoTestsPackage(true, order))),
              [limitRefused("placements", "2049")],
              order,
            );
          }
        }),
      growthTimeoutMs,
    );

    it.effect(
      "align-54 r12 assembly limit: 256 placements of a section document of 16,384 bytes, 4 MiB placed, are accepted, and of one of 16,385 bytes refused naming the bytes bound at the 256th, 4,194,560 bytes",
      () =>
        Effect.gen(function* placedBytes() {
          acceptedOf(yield* openPackage(location, sizedPackage(16_384)));
          assert.deepStrictEqual(refusalsOf(yield* openPackage(location, sizedPackage(16_385))), [
            limitRefused("bytes", "4194560"),
          ]);
        }),
      growthTimeoutMs,
    );
  });

  describe("openPackage, a test that reads an item's context variable", () => {
    it.effect(
      "[T-9] context read through an item ref: a test whose outcome processing reads first.CTX, first.1.CTX under a selection with replacement, or the qti-default of first.CTX, which item I1 declares in a qti-context-declaration, is delivered with its processing marked, variable:<name> at the processing",
      () =>
        Effect.gen(function* contextInProcessing() {
          for (const [name, expression, selection] of [
            ["first.CTX", variableXml("first.CTX"), ""],
            ["first.1.CTX", variableXml("first.1.CTX"), replacingSelection],
            ["first.CTX", '<qti-default identifier="first.CTX"/>', ""],
          ] as const) {
            const verdict = yield* openContextReading(expression, "", selection);
            const { delivered } = deliveredAndAlone(verdict);

            assert.strictEqual(verdict.verdict, "accepted-with-unsupported", expression);
            assert.deepStrictEqual(
              delivered.test.outcomeProcessing,
              { kind: "marked" },
              expression,
            );
            assert.deepStrictEqual(
              variableMarks(delivered),
              [[`variable:${name}`, processingPath]],
              expression,
            );
            assert.deepStrictEqual(delivered.unsupported, delivered.test.unsupported, expression);
          }
        }),
    );

    it.effect(
      "align-54 prefixed references E20: a test whose outcome processing tests ITEM1.QTI_CONTEXT for NULL is accepted with its processing marked, variable:ITEM1.QTI_CONTEXT at the processing, as a read of a declared context variable is, while the document's own verdict runs it (reading 106 (\"a prefixed reference reaches every built-in variable its item ref's item holds, `QTI_CONTEXT` among them\"))",
      () =>
        Effect.gen(function* builtInContext() {
          const verdict = yield* openTestingNull(variableXml("ITEM1.QTI_CONTEXT"));
          const { alone, delivered } = deliveredAndAlone(verdict);

          assert.strictEqual(verdict.verdict, "accepted-with-unsupported");
          assert.deepStrictEqual(delivered.test.outcomeProcessing, { kind: "marked" });
          assert.deepStrictEqual(variableMarks(delivered), [
            ["variable:ITEM1.QTI_CONTEXT", processingPath],
          ]);
          assert.strictEqual(alone.test.outcomeProcessing.kind, "runs");
        }),
    );

    it.effect(
      "[T-9] context read through an item ref: item ref second's template default of T that reads first.CTX is left out, marked at the default, while its default of U and the processing, which reads first.SCORE, run",
      () =>
        Effect.gen(function* contextInDefault() {
          const verdict = yield* openContextReading(
            variableXml("first.SCORE"),
            [
              `<qti-template-default template-identifier="T">${variableXml("first.CTX")}</qti-template-default>`,
              '<qti-template-default template-identifier="U"><qti-base-value base-type="float">2.5</qti-base-value></qti-template-default>',
            ].join(""),
          );
          const { alone, delivered } = deliveredAndAlone(verdict);

          assert.deepStrictEqual(
            [defaultsOfSecond(delivered), defaultsOfSecond(alone)],
            [["U"], ["T", "U"]],
          );
          assert.deepStrictEqual(variableMarks(delivered), [
            [
              "variable:first.CTX",
              "qti-assessment-test/qti-test-part/qti-assessment-section/qti-assessment-item-ref[2]/qti-template-default[1]",
            ],
          ]);
          assert.strictEqual(delivered.test.outcomeProcessing.kind, "runs");
        }),
    );

    it.effect(
      "[T-9] context read through an item ref, controls: a read of first.SCORE delivers the test document's own test, the document's own verdict on a read of first.CTX keeps its processing running, and a qti-test-variables of CTX is not marked",
      () =>
        Effect.gen(function* contextControls() {
          const outcome = deliveredAndAlone(yield* openContextReading(variableXml("first.SCORE")));
          const context = deliveredAndAlone(yield* openContextReading(variableXml("first.CTX")));
          const collected = deliveredAndAlone(
            yield* openContextReading(
              '<qti-sum><qti-test-variables variable-identifier="CTX" base-type="float"/></qti-sum>',
            ),
          );

          assert.strictEqual(outcome.delivered, outcome.alone);
          assert.deepStrictEqual(variableMarks(outcome.delivered), []);
          assert.strictEqual(context.alone.test.outcomeProcessing.kind, "runs");
          assert.deepStrictEqual(variableMarks(context.alone), []);
          assert.strictEqual(collected.delivered, collected.alone);
          assert.strictEqual(collected.delivered.test.outcomeProcessing.kind, "runs");
        }),
    );
  });

  describe("openPackage, a test whose one counting reading of a name is a section document's", () => {
    it.effect(
      "align-54 r12 counting reading in a section document N1: a.2.SCORE beside an own a a selection with replacement can repeat, whose item declares no SCORE, and x.y.SCORE beside an own x.y, whose item declares no SCORE, each read through a section document's a.2 or x alone, are delivered with the processing marked, variable:<name> at the processing, while the test document's own verdict runs it",
      () =>
        Effect.gen(function* countingInSection() {
          for (const [name, own, placed, before, declarations] of [
            ["a.2.SCORE", ["a", "items/i1.xml"], "a.2", replacingSelection, ""],
            [
              "x.y.SCORE",
              ["x.y", "items/i1.xml"],
              "x",
              "",
              '<qti-outcome-declaration identifier="y.SCORE" cardinality="single" base-type="float"/>',
            ],
          ] as const) {
            const verdict = yield* openCounting(name, own, placed, before, declarations);
            const { alone, delivered } = deliveredAndAlone(verdict);

            assert.strictEqual(verdict.verdict, "accepted-with-unsupported", name);
            assert.deepStrictEqual(delivered.test.outcomeProcessing, { kind: "marked" }, name);
            assert.deepStrictEqual(
              variableMarks(delivered),
              [[`variable:${name}`, processingPath]],
              name,
            );
            assert.strictEqual(alone.test.outcomeProcessing.kind, "runs", name);
            assert.deepStrictEqual(variableMarks(alone), [], name);
          }
        }),
    );

    it.effect(
      "align-54 r12 counting reading in a section document N1: the controls: beside the same section document, a.2.SCORE through an own a a selection with replacement can repeat and a.b.SCORE through an own a.b, each item declaring SCORE, are delivered as the test document's own verdict gives them, their processing running",
      () =>
        Effect.gen(function* countingOwn() {
          for (const [name, own, before] of [
            ["a.2.SCORE", ["a", "items/i2.xml"], replacingSelection],
            ["a.b.SCORE", ["a.b", "items/i2.xml"], ""],
          ] as const) {
            const verdict = yield* openCounting(name, own, "other", before, "");
            const { alone, delivered } = deliveredAndAlone(verdict);

            assert.strictEqual(delivered, alone, name);
            assert.strictEqual(delivered.test.outcomeProcessing.kind, "runs", name);
            assert.deepStrictEqual(variableMarks(delivered), [], name);
          }
        }),
    );
  });

  describe("openPackage, an item ref that names an LTI link", () => {
    it.effect(
      "align-54 LTI item ref E21: a test whose item ref lti names an LTI link, a resource of type imsbasiclti_xmlv1p3 under 3.0.0 or of type imslti_xmlv1p1 or imsltia_xmlv1p0 under 3.0.1, is accepted with the ref marked lti-link and left out of the delivered test, whose items are ITEM1's alone, while the test document's own verdict keeps the ref unmarked (reading 110 (\"an item ref may name an LTI link instead of an item\"))",
      () =>
        Effect.gen(function* linkedItemRef() {
          for (const profile of linkProfiles) {
            const label = profile.join(" ");
            const verdict = yield* openPackage(
              location,
              ltiPackage(settingTotal(variableXml("ITEM1.SCORE")), "", profile),
            );
            const { alone, delivered } = deliveredAndAlone(verdict);

            assert.strictEqual(verdict.verdict, "accepted-with-unsupported", label);
            assert.deepStrictEqual(linkMarks(delivered), [ltiRefPath], label);
            assert.deepStrictEqual(delivered.unsupported, delivered.test.unsupported, label);
            assert.deepStrictEqual(
              itemRefs(delivered),
              [{ href: "items/a.xml", identifier: "ITEM1" }],
              label,
            );
            assert.deepStrictEqual(
              [...testOf(acceptedOf(verdict), fileLocation(location, "test.xml")).items.keys()],
              ["ITEM1"],
              label,
            );
            assert.strictEqual(delivered.test.outcomeProcessing.kind, "runs", label);
            assert.deepStrictEqual(
              itemRefs(alone).map((ref) => ref.identifier),
              ["ITEM1", "lti"],
              label,
            );
            assert.deepStrictEqual(linkMarks(alone), [], label);
          }
        }),
    );

    it.effect(
      "align-54 LTI item ref E21, control: an item ref that names a webcontent resource at the same path is still refused item-ref-unresolved, as one that names no item resource is",
      () =>
        Effect.gen(function* webcontentItemRef() {
          assert.deepStrictEqual(
            refusalsOf(
              yield* openPackage(
                location,
                ltiPackage(settingTotal(oneFloat), "", ["3.0.1", "webcontent"]),
              ),
            ).map((refusal) => [refusal.rule, refusal.location]),
            [["item-ref-unresolved", { kind: "path", path: ltiRefPath }]],
          );
        }),
    );

    it.effect(
      "align-54 LTI item ref E21: a read through it of the built-in lti.numAttempts or lti.completionStatus is accepted with the processing marked variable:<name> at the processing, as a read of a variable the engine holds no value of is, while the document's own verdict runs it (reading 106 (\"a prefixed reference reaches every built-in variable its item ref's item holds, `QTI_CONTEXT` among them\"))",
      () =>
        Effect.gen(function* linkedBuiltIns() {
          for (const name of ["lti.numAttempts", "lti.completionStatus"]) {
            const verdict = yield* openPackage(
              location,
              ltiPackage(
                `<qti-outcome-condition><qti-outcome-if><qti-is-null>${variableXml(name)}</qti-is-null>${settingTotal(oneFloat)}</qti-outcome-if></qti-outcome-condition>`,
              ),
            );
            const { alone, delivered } = deliveredAndAlone(verdict);

            assert.strictEqual(verdict.verdict, "accepted-with-unsupported", name);
            assert.deepStrictEqual(delivered.test.outcomeProcessing, { kind: "marked" }, name);
            assert.deepStrictEqual(
              variableMarks(delivered),
              [[`variable:${name}`, processingPath]],
              name,
            );
            assert.deepStrictEqual(linkMarks(delivered), [ltiRefPath], name);
            assert.strictEqual(alone.test.outcomeProcessing.kind, "runs", name);
          }
        }),
    );

    it.effect(
      "align-54 LOM languages E21: a test whose LTI ref is left out is delivered with each expression of its outcome processing that counts over its items marked at its own path, and the processing marked, while the document's own verdict runs it",
      () =>
        Effect.gen(function* linkedCounts() {
          const verdict = yield* openPackage(
            location,
            ltiPackage(
              `${settingTotal(`<qti-sum><qti-number-presented/>${oneFloat}</qti-sum>`)}${settingTotal(oneFloat)}${settingTotal('<qti-sum><qti-test-variables variable-identifier="SCORE"/></qti-sum>')}`,
            ),
          );
          const { alone, delivered } = deliveredAndAlone(verdict);

          assert.strictEqual(verdict.verdict, "accepted-with-unsupported");
          assert.deepStrictEqual(delivered.test.outcomeProcessing, { kind: "marked" });
          assert.deepStrictEqual(
            delivered.unsupported.map(({ feature, path: at }) => [feature, at]),
            [
              ["lti-link", ltiRefPath],
              [
                "qti-number-presented",
                `${processingPath}/qti-set-outcome-value[1]/qti-sum/qti-number-presented`,
              ],
              [
                "qti-test-variables",
                `${processingPath}/qti-set-outcome-value[3]/qti-sum/qti-test-variables`,
              ],
            ],
          );
          assert.deepStrictEqual(delivered.unsupported, delivered.test.unsupported);
          assert.strictEqual(alone.test.outcomeProcessing.kind, "runs");
          assert.deepStrictEqual(alone.unsupported, []);
        }),
    );

    it.effect(
      "align-54 R3 LTI unchecked G2-2: lti.SCORE, a name no built-in gives, read through the LTI item ref in the test's outcome processing is accepted with the processing marked variable:lti.SCORE at it, as a read the engine holds no value of is, while the document's own verdict runs it (reading 106 (\"an item ref that names an LTI link has no item whose declarations a prefix reads, so a prefixed reference through it is accepted unchecked, a recorded limit\"))",
      () =>
        Effect.gen(function* linkedName() {
          const verdict = yield* openPackage(
            location,
            ltiPackage(settingTotal(variableXml("lti.SCORE"))),
          );
          const { alone, delivered } = deliveredAndAlone(verdict);

          assert.deepStrictEqual(refusalsOf(verdict), []);
          assert.strictEqual(verdict.verdict, "accepted-with-unsupported");
          assert.deepStrictEqual(delivered.test.outcomeProcessing, { kind: "marked" });
          assert.deepStrictEqual(variableMarks(delivered), [
            ["variable:lti.SCORE", processingPath],
          ]);
          assert.deepStrictEqual(linkMarks(delivered), [ltiRefPath]);
          assert.strictEqual(alone.test.outcomeProcessing.kind, "runs");
        }),
    );

    it.effect(
      'align-54 R3 LTI unchecked G2-2: a qti-map-response of lti.RESPONSE and a qti-correct of lti.X are each accepted with the processing marked variable:<name> at it, as a qti-variable of one is, while the document\'s own verdict runs it (reading 166 ("a dotted map response of a mapped response, a dotted correct of a response, and a name read through an LTI link (reading 110) are accepted"))',
      () =>
        Effect.gen(function* linkedReaders() {
          for (const [name, expression] of [
            ["lti.RESPONSE", '<qti-map-response identifier="lti.RESPONSE"/>'],
            ["lti.X", '<qti-correct identifier="lti.X"/>'],
          ] as const) {
            const verdict = yield* openPackage(location, ltiPackage(settingTotal(expression)));
            const { alone, delivered } = deliveredAndAlone(verdict);

            assert.deepStrictEqual(refusalsOf(verdict), [], expression);
            assert.strictEqual(verdict.verdict, "accepted-with-unsupported", expression);
            assert.deepStrictEqual(
              delivered.test.outcomeProcessing,
              { kind: "marked" },
              expression,
            );
            assert.deepStrictEqual(
              variableMarks(delivered),
              [[`variable:${name}`, processingPath]],
              expression,
            );
            assert.deepStrictEqual(linkMarks(delivered), [ltiRefPath], expression);
            assert.strictEqual(alone.test.outcomeProcessing.kind, "runs", expression);
          }
        }),
    );

    it.effect(
      'align-54 R3 LTI unchecked G2-2, control: the numbered lti.1.SCORE counts as a numbered reading through an item does, so with no selection with replacement it is refused undeclared-variable with check numbered (reading 88 ("a numbered reference such as `Q01.2.SCORE` names an instance of an item ref that a selection with replacement can repeat, and nothing else"))',
      () =>
        Effect.gen(function* linkedNumbered() {
          assert.deepStrictEqual(
            refusalsOf(
              yield* openPackage(location, ltiPackage(settingTotal(variableXml("lti.1.SCORE")))),
            ),
            [
              {
                detail: {
                  check: "numbered",
                  element: "qti-variable",
                  identifier: "lti.1.SCORE",
                  itemRef: "lti",
                  reading: "88",
                  reference: "lti.1.SCORE",
                },
                document: fileLocation(location, "test.xml"),
                location: { kind: "path", path: `${expressionAt("qti-variable")}/@identifier` },
                rule: "undeclared-variable",
              },
            ],
          );
        }),
    );

    it.effect(
      'align-54 R3 LTI unchecked G2-2: under the LTI item ref a variable mapping of SCORE is accepted, as no rule judges it, and a template default of T is the one refusal, undeclared-variable with expected template (reading 110 ("under an item ref that names an LTI link a variable mapping is accepted unchecked, a recorded limit, and a template default is refused"))',
      () =>
        Effect.gen(function* linkedMappingAndDefault() {
          assert.deepStrictEqual(
            refusalsOf(
              yield* openPackage(
                location,
                ltiPackage(
                  settingTotal(oneFloat),
                  '<qti-variable-mapping source-identifier="SCORE" target-identifier="S2"/><qti-template-default template-identifier="T"><qti-base-value base-type="integer">1</qti-base-value></qti-template-default>',
                ),
              ),
            ),
            [
              {
                detail: {
                  attribute: "template-identifier",
                  element: "qti-template-default",
                  expected: "template",
                  identifier: "T",
                },
                document: fileLocation(location, "test.xml"),
                location: {
                  kind: "path",
                  path: `${ltiRefPath}/qti-template-default/@template-identifier`,
                },
                rule: "undeclared-variable",
              },
            ],
          );
        }),
    );

    it.effect(
      'align-54 r11 LTI mapping targets finding 6: under the LTI item ref, of three variable mappings the second of target S2 is refused as duplicate-identifier at its target-identifier, and the one whose target is the built-in session variable duration as duplicate-identifier with reading 97, as under an item, while their undeclared sources stay unchecked (reading 97 ("a target that another variable of the item already holds would make two variables of one name there: ... one another mapping of the same item ref names; or a built-in session variable. Each is refused"))',
      () =>
        Effect.gen(function* linkedMappingTargets() {
          assert.deepStrictEqual(
            refusalsOf(
              yield* openPackage(
                location,
                ltiPackage(
                  settingTotal(oneFloat),
                  '<qti-variable-mapping source-identifier="A" target-identifier="S2"/><qti-variable-mapping source-identifier="B" target-identifier="S2"/><qti-variable-mapping source-identifier="C" target-identifier="duration"/>',
                ),
              ),
            ),
            [
              {
                detail: { identifier: "S2" },
                document: fileLocation(location, "test.xml"),
                location: {
                  kind: "path",
                  path: `${ltiRefPath}/qti-variable-mapping[2]/@target-identifier`,
                },
                rule: "duplicate-identifier",
              },
              {
                detail: { identifier: "duration", reading: "97" },
                document: fileLocation(location, "test.xml"),
                location: {
                  kind: "path",
                  path: `${ltiRefPath}/qti-variable-mapping[3]/@target-identifier`,
                },
                rule: "duplicate-identifier",
              },
            ],
          );
        }),
    );

    it.effect(
      'align-54 r11 LTI mapping targets finding 6: under the LTI item ref a variable mapping whose target is the session variable completionStatus or numAttempts is refused as duplicate-identifier with reading 97 at its target-identifier, as one of duration is (reading 97 ("The identifiers of the built-in session variables are reserved. They are completionStatus, numAttempts and duration"))',
      () =>
        Effect.gen(function* linkedSessionTargets() {
          for (const target of ["completionStatus", "numAttempts"]) {
            assert.deepStrictEqual(
              refusalsOf(
                yield* openPackage(
                  location,
                  ltiPackage(
                    settingTotal(oneFloat),
                    `<qti-variable-mapping source-identifier="A" target-identifier="${target}"/>`,
                  ),
                ),
              ),
              [
                {
                  detail: { identifier: target, reading: "97" },
                  document: fileLocation(location, "test.xml"),
                  location: {
                    kind: "path",
                    path: `${ltiRefPath}/qti-variable-mapping/@target-identifier`,
                  },
                  rule: "duplicate-identifier",
                },
              ],
              target,
            );
          }
        }),
    );

    it.effect(
      'align-54 r11 LTI mapping targets finding 6: under the LTI item ref a variable mapping whose source A nothing declares and whose target is S2, one whose target is QTI_CONTEXT, and one whose target duration is its own source are each accepted, as the link holds no item variables and a mapping onto its own source maps nothing away (reading 110 ("a mapping\'s source under such an item ref names a variable nothing in the package lists ... accepted unchecked"); reading 97 ("A mapping whose target is its own source maps nothing away and is valid"))',
      () =>
        Effect.gen(function* linkedAcceptedMappings() {
          for (const mapping of [
            '<qti-variable-mapping source-identifier="A" target-identifier="S2"/>',
            '<qti-variable-mapping source-identifier="A" target-identifier="QTI_CONTEXT"/>',
            '<qti-variable-mapping source-identifier="duration" target-identifier="duration"/>',
          ]) {
            const verdict = yield* openPackage(
              location,
              ltiPackage(settingTotal(oneFloat), mapping),
            );

            assert.deepStrictEqual(refusalsOf(verdict), [], mapping);
            assert.strictEqual(verdict.verdict, "accepted-with-unsupported", mapping);
          }
        }),
    );

    it.effect(
      "a54-r3-lang amendment: a template default of T under ITEM1's item ref whose expression reads through the LTI item ref by a qti-correct, a qti-map-response or a qti-map-response-point is left out and marked variable:<name> at the default, as one that reads by a qti-variable is, the two mappings each inside a qti-round of T's integer type, while the processing runs and the document's own verdict keeps it (reading 166 (\"a name read through an LTI link (reading 110) [is] accepted\"))",
      () =>
        Effect.gen(function* linkedReadInDefault() {
          for (const [name, expression] of [
            ["lti.X", '<qti-correct identifier="lti.X"/>'],
            [
              "lti.RESPONSE",
              '<qti-round><qti-map-response identifier="lti.RESPONSE"/></qti-round>',
            ],
            [
              "lti.POINT",
              '<qti-round><qti-map-response-point identifier="lti.POINT"/></qti-round>',
            ],
          ] as const) {
            const files = new Map(ltiPackage(settingTotal(oneFloat)));
            files.set(
              "test.xml",
              new TextEncoder().encode(
                processingTestXml(
                  settingTotal(oneFloat),
                  itemRefXml(
                    "ITEM1",
                    "items/a.xml",
                    `<qti-template-default template-identifier="T">${expression}</qti-template-default>`,
                  ),
                  itemRefXml("lti", "links/lti.xml"),
                ),
              ),
            );

            const verdict = yield* openPackage(location, files);
            const { alone, delivered } = deliveredAndAlone(verdict);

            assert.deepStrictEqual(refusalsOf(verdict), [], expression);
            assert.deepStrictEqual(
              [defaultsUnder(delivered, "ITEM1"), defaultsUnder(alone, "ITEM1")],
              [[], ["T"]],
              expression,
            );
            assert.deepStrictEqual(
              variableMarks(delivered),
              [
                [
                  `variable:${name}`,
                  "qti-assessment-test/qti-test-part/qti-assessment-section/qti-assessment-item-ref[1]/qti-template-default",
                ],
              ],
              expression,
            );
            assert.strictEqual(delivered.test.outcomeProcessing.kind, "runs", expression);
          }
        }),
    );
  });

  describe("openPackage, the assembled test", () => {
    it.effect(
      'align-54 test assembly B6: a reference from the test through item ref I1 of a section document placed twice reads one placement each way, so it is refused as ambiguous-reference, the two readings alike (reading 86 ("a section document a test places twice is written once"))',
      () =>
        Effect.gen(function* placedTwiceOutside() {
          assert.deepStrictEqual(
            refusalsOf(yield* openPlacing(settingTotal(variableXml("I1.SCORE")), placedTwice)),
            [
              {
                detail: {
                  firstPrefix: "I1",
                  firstVariable: "SCORE",
                  reading: "86",
                  reference: "I1.SCORE",
                  secondPrefix: "I1",
                  secondVariable: "SCORE",
                },
                document: fileLocation(location, "test.xml"),
                location: {
                  kind: "path",
                  path: "qti-assessment-test/qti-outcome-processing/qti-set-outcome-value/qti-variable/@identifier",
                },
                rule: "ambiguous-reference",
              },
            ],
          );
        }),
    );

    it.effect(
      'align-54 test assembly B6: control: the same reference inside the section document placed twice reads its own placement, so it is accepted (reading 145 ("a fragment a test or a section document splices is judged in the test that places it, once per placement"))',
      () =>
        Effect.gen(function* placedTwiceInside() {
          acceptedOf(
            yield* openPlacing(
              settingTotal(oneFloat),
              placedTwice,
              preConditionXml(greaterXml("I1.SCORE")),
            ),
          );
        }),
    );

    it.effect(
      'align-54 test assembly B6: each placement keeps its own selection with replacement: I1.1.SCORE inside S2, placed first under one and then under none, is refused once as undeclared-variable with check numbered, from the second placement (reading 88 ("a numbered reference such as Q01.2.SCORE names an instance of an item ref that a selection with replacement can repeat, and nothing else"))',
      () =>
        Effect.gen(function* placementSelection() {
          assert.deepStrictEqual(
            refusalsOf(
              yield* openPlacing(
                settingTotal(oneFloat),
                `<qti-assessment-section identifier="OUTER" title="OUTER" visible="true">${replacingSelection}${sectionRefXml("R1", "sections/s2.xml")}</qti-assessment-section>${sectionRefXml("R2", "sections/s2.xml")}`,
                preConditionXml(greaterXml("I1.1.SCORE")),
              ),
            ),
            [
              atSection("qti-pre-condition/qti-gt/qti-variable", "identifier", {
                check: "numbered",
                element: "qti-variable",
                identifier: "I1.1.SCORE",
                itemRef: "I1",
                reading: "88",
                reference: "I1.1.SCORE",
              }),
            ],
          );
        }),
    );

    it.effect(
      "align-54 test assembly B6: a chain of 40 section documents, each placing the next twice, opens within the default timeout, and the test's reference through the last one's item ref is still refused as ambiguous-reference (reading 86 (\"a section document a test places twice is written once\"))",
      () =>
        Effect.gen(function* doublingChain() {
          assert.deepStrictEqual(refusalsOf(yield* openPackage(location, doublingPackage(40))), [
            {
              detail: {
                firstPrefix: "I39",
                firstVariable: "SCORE",
                reading: "86",
                reference: "I39.SCORE",
                secondPrefix: "I39",
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

    it.effect(
      'align-54 test assembly B6: a reference in section document U through item ref I0 of S0, the document that places U, reads the placement of S0 that holds it, so it is accepted though the test places S0 twice; placed by the test too, U reads I0 from outside S0 as well, and the reference is refused as ambiguous-reference (reading 86 ("a section document a test places twice is written once"))',
      () =>
        Effect.gen(function* holdingPlacement() {
          acceptedOf(yield* openPackage(location, holdingFiles("")));
          assert.deepStrictEqual(
            refusalsOf(
              yield* openPackage(location, holdingFiles(sectionRefXml("R3", "sections/u.xml"))),
            ),
            [
              {
                detail: {
                  firstPrefix: "I0",
                  firstVariable: "SCORE",
                  reading: "86",
                  reference: "I0.SCORE",
                  secondPrefix: "I0",
                  secondVariable: "SCORE",
                },
                document: fileLocation(location, "sections/u.xml"),
                location: {
                  kind: "path",
                  path: "qti-assessment-section/qti-assessment-item-ref/qti-pre-condition/qti-gt/qti-variable/@identifier",
                },
                rule: "ambiguous-reference",
              },
            ],
          );
        }),
    );

    it.effect(
      'align-54 test assembly E7: a section document whose section ref places itself, and two that place each other, are refused once as inclusion-cycle at the section ref that returns, its chain the documents from the test (reading 85 ("an inclusion never reaches itself"))',
      () =>
        Effect.gen(function* inclusionCycles() {
          assert.deepStrictEqual(
            refusalsOf(yield* openPackage(location, loopFiles(sectionRefXml("R2", "s2.xml"), ""))),
            [
              cycleRefused(
                "sections/s2.xml",
                "R2",
                "s2.xml",
                "test.xml sections/s2.xml sections/s2.xml",
              ),
            ],
          );
          assert.deepStrictEqual(
            refusalsOf(
              yield* openPackage(
                location,
                loopFiles(sectionRefXml("R2", "s3.xml"), sectionRefXml("R3", "s2.xml")),
              ),
            ),
            [
              cycleRefused(
                "sections/s3.xml",
                "R3",
                "s2.xml",
                "test.xml sections/s2.xml sections/s3.xml sections/s2.xml",
              ),
            ],
          );
        }),
    );

    it.effect(
      'align-54 R3 remote section C: a test whose section ref\'s href is an absolute URI, a path from a host\'s root, or a .. that climbs above the package\'s root is refused as package-path-outside with check remote-section at the ref, its href as written, and the ref places nothing; a section ref to a held section document is accepted (reading 170 ("A section ref whose href is external is refused under the stated limit "Remote section ref""))',
      () =>
        Effect.gen(function* remoteSectionRefs() {
          for (const href of ["https://example.com/s.xml", "/sections/s2.xml", "../../s2.xml"]) {
            assert.deepStrictEqual(
              refusalsOf(yield* openPlacing(settingTotal(oneFloat), sectionRefXml("R", href))),
              [remoteRefused("test.xml", testSectionRefPath, href)],
              href,
            );
          }

          acceptedOf(
            yield* openPlacing(settingTotal(oneFloat), sectionRefXml("R", "sections/s2.xml")),
          );
        }),
    );

    it.effect(
      'align-54 R3 remote section C: a section ref under an xml:base outside the package names no path inside it, so it is refused as package-path-outside with check remote-section though its href names a held section document; the test is refused for the xml:base itself all the same (reading 170 ("A section ref whose href is external is refused under the stated limit "Remote section ref""); reading 103 ("an xml:base is a base, resolved and never a file reference"))',
      () =>
        Effect.gen(function* basedRemoteSectionRef() {
          assert.deepStrictEqual(
            refusalsOf(
              yield* openPlacing(
                settingTotal(oneFloat),
                '<qti-assessment-section-ref identifier="R" href="sections/s2.xml" xml:base="https://example.com/"/>',
              ),
            ),
            [
              remoteRefused("test.xml", testSectionRefPath, "sections/s2.xml"),
              {
                detail: {
                  attribute: "xml:base",
                  element: "qti-assessment-section-ref",
                  reading: "90",
                },
                document: fileLocation(location, "test.xml"),
                location: { kind: "path", path: `${testSectionRefPath}/@xml:base` },
                rule: "unknown-attribute",
              },
            ],
          );
        }),
    );

    it.effect(
      'align-54 R3 remote section C: a section document the test places twice through held refs, whose own section ref is external, is refused once as package-path-outside with check remote-section at that document\'s ref (reading 170 ("A section ref whose href is external is refused under the stated limit "Remote section ref""))',
      () =>
        Effect.gen(function* reachedRemoteSectionRef() {
          assert.deepStrictEqual(
            refusalsOf(
              yield* openPackage(
                location,
                packageOf(
                  referringFiles(
                    settingTotal(oneFloat),
                    placedTwice,
                    sectionXml("", sectionRefXml("R3", "https://example.com/s.xml")),
                  ),
                ),
              ),
            ),
            [
              remoteRefused(
                "sections/s2.xml",
                "qti-assessment-section/qti-assessment-section-ref",
                "https://example.com/s.xml",
              ),
            ],
          );
        }),
    );

    it.effect(
      'align-54 R3 remote section C: an item ref of a section document the test places twice that names no item is refused once as item-ref-unresolved at that document\'s item ref, as the test\'s own item refs are, beside the file reference it names (reading 155 ("the laws over what an item ref names judge every item ref"); reading 103 ("each one that resolves within the package names a file the manifest describes"))',
      () =>
        Effect.gen(function* reachedUnresolvedItemRef() {
          const itemRef = "qti-assessment-section/qti-assessment-item-ref";

          assert.deepStrictEqual(
            refusalsOf(
              yield* openPackage(
                location,
                packageOf(
                  referringFiles(
                    settingTotal(oneFloat),
                    placedTwice,
                    sectionDocumentXml("S2", itemRefXml("I1", "../items/none.xml")),
                  ),
                ),
              ),
            ),
            [
              {
                detail: { href: "../items/none.xml", identifier: "I1", path: "items/none.xml" },
                document: fileLocation(location, "sections/s2.xml"),
                location: { kind: "path", path: itemRef },
                rule: "item-ref-unresolved",
              },
              missingReference(itemRef, "href", "items/none.xml", "sections/s2.xml"),
            ],
          );
        }),
    );

    it.effect(
      'align-54 test assembly E8b: a branch rule of the test whose target lies past a section ref, inside the section document it places, is refused as branch-target, unknown placed once and ambiguous placed twice (reading 87 ("from outside a section document a ref places, no target lies inside it"))',
      () =>
        Effect.gen(function* branchIntoPlacement() {
          assert.deepStrictEqual(
            refusalsOf(
              yield* openBranching(sectionRefXml("R", "sections/s2.xml"), branchRuleXml("I1")),
            ),
            [branchRefused("test.xml", item0RulePath, "I1", "unknown")],
          );
          assert.deepStrictEqual(
            refusalsOf(yield* openBranching(placedTwice, branchRuleXml("I1"))),
            [branchRefused("test.xml", item0RulePath, "I1", "ambiguous")],
          );
        }),
    );

    it.effect(
      'align-54 test assembly E8b: a branch rule of the placed section document whose target ITEMB comes before its section ref is refused as backward, and accepted when their nearest common section shuffles (reading 87 ("their order is drawn at delivery and is not judged here"))',
      () =>
        Effect.gen(function* branchShuffled() {
          assert.deepStrictEqual(
            refusalsOf(yield* openBranching(outerXml(""), "", branchRuleXml("ITEMB"))),
            [
              branchRefused(
                "sections/s2.xml",
                "qti-assessment-section/qti-assessment-item-ref/qti-branch-rule",
                "ITEMB",
                "backward",
              ),
            ],
          );
          acceptedOf(
            yield* openBranching(
              outerXml('<qti-ordering shuffle="true"/>'),
              "",
              branchRuleXml("ITEMB"),
            ),
          );
        }),
    );

    it.effect(
      "align-54 test assembly E14: a variable mapping whose target is another outcome of its item, OTHER, or a built-in, numAttempts, is refused as duplicate-identifier at the target, and one whose target is its own source or a fresh name is accepted (reading 97 (\"a variable mapping's target names no other variable its item ref's item holds\"))",
      () =>
        Effect.gen(function* mappingTargets() {
          for (const target of ["OTHER", "numAttempts"]) {
            assert.deepStrictEqual(
              refusalsOf(
                yield* openPackage(
                  location,
                  mappingPackage(
                    `<qti-variable-mapping source-identifier="SCORE" target-identifier="${target}"/>`,
                    itemXml("a", "SCORE", "OTHER"),
                  ),
                ),
              ),
              [
                {
                  detail: { identifier: target, reading: "97" },
                  document: fileLocation(location, "test.xml"),
                  location: {
                    kind: "path",
                    path: `${itemRefChildAt("qti-variable-mapping")}/@target-identifier`,
                  },
                  rule: "duplicate-identifier",
                },
              ],
              target,
            );
          }

          for (const target of ["SCORE", "NEW"]) {
            acceptedOf(
              yield* openPackage(
                location,
                mappingPackage(
                  `<qti-variable-mapping source-identifier="SCORE" target-identifier="${target}"/>`,
                  itemXml("a", "SCORE", "OTHER"),
                ),
              ),
            );
          }
        }),
    );

    it.effect(
      'align-54 test assembly E41b: an item ref that writes no identifier is judged like any other: one whose href names no item is refused as item-ref-unresolved with check unwritten, and one whose href names an item has its mappings checked; the missing identifier is left to the test\'s own verdict (reading 155 ("the laws over what an item ref names judge every item ref, whether or not it ... write[s] an identifier"))',
      () =>
        Effect.gen(function* unnamedItemRef() {
          const unnamed = (content: string, href: string) =>
            openPackage(
              location,
              readingPackage(
                readingTestXml(
                  oneFloat,
                  "",
                  `<qti-assessment-item-ref href="${href}">${content}</qti-assessment-item-ref>`,
                ),
                { "items/a.xml": itemXml("a", "SCORE") },
              ),
            );

          assert.deepStrictEqual(besideMissing(yield* unnamed("", "items/none.xml")), [
            {
              detail: {
                attribute: "identifier",
                check: "unwritten",
                href: "items/none.xml",
                path: "items/none.xml",
                reading: "155",
              },
              document: fileLocation(location, "test.xml"),
              location: {
                kind: "path",
                path: "qti-assessment-test/qti-test-part/qti-assessment-section/qti-assessment-item-ref",
              },
              rule: "item-ref-unresolved",
            },
            missingReference(
              "qti-assessment-test/qti-test-part/qti-assessment-section/qti-assessment-item-ref",
              "href",
              "items/none.xml",
              "test.xml",
            ),
          ]);
          assert.deepStrictEqual(
            besideMissing(
              yield* unnamed(
                '<qti-variable-mapping source-identifier="NOPE" target-identifier="X"/>',
                "items/a.xml",
              ),
            ),
            [
              {
                detail: {
                  attribute: "source-identifier",
                  element: "qti-variable-mapping",
                  expected: "outcome",
                  identifier: "NOPE",
                },
                document: fileLocation(location, "test.xml"),
                location: {
                  kind: "path",
                  path: `${itemRefChildAt("qti-variable-mapping")}/@source-identifier`,
                },
                rule: "undeclared-variable",
              },
            ],
          );
        }),
    );

    it.effect(
      'align-54 r11 unreached section documents finding 9: a section document the manifest lists and no test places is judged as a placed one is, each refusal at it: an external section ref is package-path-outside with check remote-section, an item ref naming a webcontent file or an external href is item-ref-unresolved, and a variable mapping whose source its item does not declare is undeclared-variable at its source-identifier (reading 170 ("A section ref whose href is external is refused under the stated limit "Remote section ref""); reading 155 ("the laws over what an item ref names judge every item ref"))',
      () =>
        Effect.gen(function* unreachedSections() {
          for (const [label, section, refusals] of unreachedCases) {
            assert.deepStrictEqual(refusalsOf(yield* openListing("", section)), refusals, label);
          }
        }),
    );

    it.effect(
      "align-54 r11 unreached section documents finding 9, control: the same section document placed by a test gives each refusal once, as the placed document's judgement alone gives it",
      () =>
        Effect.gen(function* reachedSections() {
          for (const [label, section, refusals] of unreachedCases) {
            assert.deepStrictEqual(
              refusalsOf(yield* openListing(sectionRefXml("R", "sections/s2.xml"), section)),
              refusals,
              label,
            );
          }
        }),
    );

    it.effect(
      'align-54 document roots B6: a dotted name each of whose 30 dots splits it at an item ref of another section document, each of which the placement that holds the name reads both from inside and from outside, is judged once for each kind of answer its readings give, not once for each of the 2^30 ways to read those documents, and is accepted within the default timeout (reading 86 ("a section document a test places twice is written once"))',
      () =>
        Effect.gen(function* manyViews() {
          acceptedOf(yield* openPackage(location, viewingPackage(30)));
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

/**
 * The forms of a structure identifier that are no `xs:NCName`, each with the name a case's title
 * gives it (reading 152 as amended).
 */
const namelessForms = [
  { form: "1a", name: "1a" },
  { form: "a b", name: "a b" },
  { form: "", name: "the empty string" },
  { form: "   ", name: "whitespace alone" },
  { form: "٠a", name: "U+0660 a" },
] as const;

/**
 * Write a linear, individual test part.
 *
 * @param identifier Its `identifier`, as written.
 * @param content What it holds, as written.
 * @returns The part's text.
 */
const namedPartXml = (identifier: string, content: string): string =>
  `<qti-test-part identifier="${identifier}" navigation-mode="linear" submission-mode="individual">${content}</qti-test-part>`;

/**
 * Write a visible section of a test.
 *
 * @param identifier Its `identifier`, as written.
 * @param content What it holds, as written.
 * @returns The section's text.
 */
const namedSectionXml = (identifier: string, content: string): string =>
  `<qti-assessment-section identifier="${identifier}" title="S" visible="true">${content}</qti-assessment-section>`;

/**
 * Open a package whose test `T`, at `test.xml`, holds the given parts, beside the items `a` and `b`
 * at `items/a.xml` and `items/b.xml` and a section document at `sections/s.xml`, each listed as a
 * resource of its type, the test first.
 *
 * @param parts The test's parts, as written.
 * @param section The section document's text; the default places nothing the cases judge.
 * @returns The package's verdict.
 */
const openNameless = (parts: string, section = sectionDocumentXml("S9", "")) =>
  openPackage(
    location,
    packageOf({
      "items/a.xml": itemXml("a"),
      "items/b.xml": itemXml("b"),
      [manifestFile]: manifestXml(
        resourceXml("T", "imsqti_test_xmlv3p0", "test.xml"),
        resourceXml("A", "imsqti_item_xmlv3p0", "items/a.xml"),
        resourceXml("B", "imsqti_item_xmlv3p0", "items/b.xml"),
        resourceXml("S", "imsqti_section_xmlv3p0", "sections/s.xml"),
      ),
      "sections/s.xml": section,
      "test.xml": `<qti-assessment-test xmlns="${qti}" identifier="T" title="T">${parts}</qti-assessment-test>`,
    }),
  );

/**
 * Write a part `P` that holds the given content and then the section ref `R`, which places the
 * section document at `sections/s.xml`.
 *
 * @param content What the part holds before the section ref, as written.
 * @returns The part's text.
 */
const placingPartXml = (content: string): string =>
  namedPartXml("P", `${content}${sectionRefXml("R", "sections/s.xml")}`);

/**
 * Take each refusal's rule, document and path of a package verdict, for a case whose details are
 * the structural walk's own.
 *
 * @param verdict The package verdict.
 * @returns Each refusal's rule, document and path, in order.
 */
const sitesOf = (verdict: PackageVerdict): (readonly [string, string, string])[] =>
  refusalsOf(verdict).map(({ document, location: at, rule }) => [
    rule,
    document,
    at.kind === "path" ? at.path : at.kind,
  ]);

/**
 * A refusal's rule, document and path at an attribute of the test at `test.xml`.
 *
 * @param rule The refusal's rule.
 * @param at The attribute's path.
 * @returns The site, as {@link sitesOf} gives it.
 */
const atTest = (rule: string, at: string) =>
  [rule, fileLocation(location, "test.xml"), at] as const;

describe("openPackage, align-54 r11 reading 152 names nothing: a structure identifier that is no NCName names nothing across a test's reach, so no law but its value domain judges it (reading 152 as amended)", () => {
  it.effect.each(namelessForms)(
    "align-54 r11 reading 152 names nothing decision 457 (2): an item ref, and a section, that write $name in the test and again in the section document it places are refused attribute-type at each, and not duplicate-identifier",
    ({ form }) =>
      Effect.gen(function* acrossDocuments() {
        const twoItemRefs = yield* openNameless(
          placingPartXml(namedSectionXml("S", itemRefXml(form, "items/a.xml"))),
          sectionDocumentXml("S2", itemRefXml(form, "../items/b.xml")),
        );
        const sections = yield* openNameless(
          placingPartXml(namedSectionXml(form, itemRefXml("I1", "items/a.xml"))),
          `<qti-assessment-section xmlns="${qti}" identifier="${form}" title="S2" visible="true">${itemRefXml("I2", "../items/b.xml")}</qti-assessment-section>`,
        );

        assert.deepStrictEqual(
          [sitesOf(twoItemRefs), sitesOf(sections)],
          [
            [
              atTest(
                "attribute-type",
                "qti-assessment-test/qti-test-part/qti-assessment-section/qti-assessment-item-ref/@identifier",
              ),
              [
                "attribute-type",
                fileLocation(location, "sections/s.xml"),
                "qti-assessment-section/qti-assessment-item-ref/@identifier",
              ],
            ],
            [
              atTest(
                "attribute-type",
                "qti-assessment-test/qti-test-part/qti-assessment-section/@identifier",
              ),
              [
                "attribute-type",
                fileLocation(location, "sections/s.xml"),
                "qti-assessment-section/@identifier",
              ],
            ],
          ],
        );
      }),
  );

  it.effect(
    "align-54 r11 reading 152 names nothing decision 457 (2): a branch rule of a part 1a, or of an item ref 1a, to a later name is refused branch-target unknown beside the owner's attribute-type, as a rule whose owner writes no identifier is (reading 147)",
    () =>
      Effect.gen(function* namelessOwner() {
        const ofPart = yield* openNameless(
          `${namedPartXml("1a", `${branchRuleXml("Q")}${namedSectionXml("S1", itemRefXml("I1", "items/a.xml"))}`)}${namedPartXml("Q", namedSectionXml("S2", itemRefXml("I2", "items/b.xml")))}`,
        );
        const ofItemRef = yield* openNameless(
          namedPartXml(
            "P",
            namedSectionXml(
              "S",
              `${itemRefXml("1a", "items/a.xml", branchRuleXml("I2"))}${itemRefXml("I2", "items/b.xml")}`,
            ),
          ),
        );
        const itemRefPath = "qti-assessment-test/qti-test-part/qti-assessment-section";

        assert.deepStrictEqual(
          [sitesOf(ofPart), sitesOf(ofItemRef)],
          [
            [
              atTest(
                "branch-target",
                "qti-assessment-test/qti-test-part[1]/qti-branch-rule/@target",
              ),
              atTest("attribute-type", "qti-assessment-test/qti-test-part[1]/@identifier"),
            ],
            [
              atTest(
                "branch-target",
                `${itemRefPath}/qti-assessment-item-ref[1]/qti-branch-rule/@target`,
              ),
              atTest("attribute-type", `${itemRefPath}/qti-assessment-item-ref[1]/@identifier`),
            ],
          ],
        );
        assert.deepStrictEqual(
          [...refusedUnder(ofPart, "branch-target"), ...refusedUnder(ofItemRef, "branch-target")],
          [
            branchRefused(
              "test.xml",
              "qti-assessment-test/qti-test-part[1]/qti-branch-rule",
              "Q",
              "unknown",
            ),
            branchRefused(
              "test.xml",
              `${itemRefPath}/qti-assessment-item-ref[1]/qti-branch-rule`,
              "I2",
              "unknown",
            ),
          ],
        );
      }),
  );

  it.effect(
    "align-54 r11 reading 152 names nothing decision 457 (2): a branch rule of part P to target 1a is refused branch-target unknown, whether a part 1a lies before P or after it, since no target resolves to a name that is no NCName",
    () =>
      Effect.gen(function* namelessTarget() {
        const first = namedPartXml("1a", namedSectionXml("S1", itemRefXml("I1", "items/a.xml")));
        const branching = namedPartXml(
          "P",
          `${branchRuleXml("1a")}${namedSectionXml("S2", itemRefXml("I2", "items/b.xml"))}`,
        );
        const earlier = yield* openNameless(`${first}${branching}`);
        const later = yield* openNameless(
          `${branching}${namedPartXml("1a", namedSectionXml("S1", itemRefXml("I1", "items/a.xml")))}`,
        );

        assert.deepStrictEqual(
          [refusedUnder(earlier, "branch-target"), refusedUnder(later, "branch-target")],
          [
            [
              branchRefused(
                "test.xml",
                "qti-assessment-test/qti-test-part[2]/qti-branch-rule",
                "1a",
                "unknown",
              ),
            ],
            [
              branchRefused(
                "test.xml",
                "qti-assessment-test/qti-test-part[1]/qti-branch-rule",
                "1a",
                "unknown",
              ),
            ],
          ],
        );
        assert.deepStrictEqual(
          [sitesOf(earlier).map(([rule]) => rule), sitesOf(later).map(([rule]) => rule)],
          [
            ["attribute-type", "attribute-type", "branch-target"],
            ["attribute-type", "attribute-type", "branch-target"],
          ],
        );
      }),
  );
});

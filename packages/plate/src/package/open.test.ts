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
import { describeRefusal } from "#plate/validate/verdict.ts";
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
      [manifestFile]: manifestXml(resourceXml("A", "imsqti_item_xmlv3p0", "items/a.xml")),
      "items/a.xml": pointsItemXml(
        timeDependent,
        `<qti-response-processing><qti-set-outcome-value identifier="SCORE">${expression}</qti-set-outcome-value></qti-response-processing>`,
      ),
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
  [manifestFile]: manifestXml(
    resourceXml("T", "imsqti_test_xmlv3p0", "test.xml"),
    resourceXml("I0", "imsqti_item_xmlv3p0", "items/b.xml"),
    resourceXml("I1", "imsqti_item_xmlv3p0", "items/a.xml"),
    resourceXml("S", "imsqti_section_xmlv3p0", "sections/s2.xml"),
  ),
  "items/a.xml": reachedItemXml,
  "items/b.xml": otherItemXml,
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
  [manifestFile]: manifestXml(
    resourceXml("T", "imsqti_test_xmlv3p0", "test.xml"),
    resourceXml("I0", "imsqti_item_xmlv3p0", "items/b.xml"),
    resourceXml("I1", "imsqti_item_xmlv3p0", "items/a.xml"),
    ...sections.map(([identifier]) =>
      resourceXml(identifier, "imsqti_section_xmlv3p0", `sections/${identifier}.xml`),
    ),
  ),
  "items/a.xml": reachedItemXml,
  "items/b.xml": otherItemXml,
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
 * Each long chain of section refs gets this bound, as its own: opening 8,000 section documents
 * takes about a second here, and the bound leaves room for a slow machine.
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
    [manifestFile]: manifestXml(
      resourceXml("T", "imsqti_test_xmlv3p0", "test.xml"),
      resourceXml("I0", "imsqti_item_xmlv3p0", "items/b.xml"),
      resourceXml("I1", "imsqti_item_xmlv3p0", "items/a.xml"),
      ...indices.map((index) =>
        resourceXml(`S${index}`, "imsqti_section_xmlv3p0", `sections/s${index}.xml`),
      ),
    ),
    "items/a.xml": reachedItemXml,
    "items/b.xml": otherItemXml,
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
      "[T-9] refuses ITEM1.SCORE as undeclared-variable when no reading resolves it, pantry's prefixed-ref (reading 48)",
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
      "[T-9] refuses a.0.SCORE when no reading resolves it, an occurrence counting from 1, and accepts a.1.SCORE (reading 4)",
      () =>
        Effect.gen(function* occurrenceFromOne() {
          assert.deepStrictEqual(
            refusalsOf(yield* openPackage(location, readingThroughA("a.0.SCORE"))).map(
              (refusal) => [refusal.rule, refusal.detail["check"]],
            ),
            [["undeclared-variable", "reading"]],
          );
          acceptedOf(yield* openPackage(location, readingThroughA("a.1.SCORE")));
        }),
    );

    it.effect(
      "[T-9] refuses a dotted name in qti-index's n that no reading resolves, as one in identifier is (reading 48)",
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
      "[T-9] accepts A.B.C declared whole beside item refs A and A.B whose items would each resolve it (reading 48)",
      () =>
        Effect.gen(function* declaredWholeBesideReadings() {
          acceptedOf(
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
          );
        }),
    );

    it.effect(
      "[T-9] refuses ITEM1.duration as untimed-duration when ITEM1's item is not time dependent, pantry's item-duration, and accepts a time-dependent item's",
      () =>
        Effect.gen(function* untimed() {
          const durationOf = (timeDependent: string) =>
            openPackage(
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
            );

          assert.deepStrictEqual(refusalsOf(yield* durationOf("false")), [
            {
              detail: {
                check: "untimed-duration",
                element: "qti-variable",
                identifier: "ITEM1.duration",
              },
              document: fileLocation(location, "test.xml"),
              location: { kind: "path", path: `${expressionAt("qti-variable")}/@identifier` },
              rule: "undeclared-variable",
            },
          ]);
          acceptedOf(yield* durationOf("true"));
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
      "[T-9] refuses a float TOTAL set from ITEM1.RESPONSE, an identifier response read through the reach, as expression-type, pantry's P20, and accepts ITEM1.SCORE and a mapping target typed as its float source",
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
          acceptedOf(
            yield* setFrom(
              "ITEM1.RESPONSE",
              '<qti-variable-mapping source-identifier="SCORE" target-identifier="RESPONSE"/>',
            ),
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
      "[T-9] refuses a prefixed map-response that resolves to nothing as undeclared-variable, pantry's prefixed-ref, and accepts ITEM1.MAPPED, a response with a mapping (reading 48)",
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
      "[T-9] refuses a dotted point without an area mapping, ITEM1.MAPPED_POINT, a point response that declares a qti-mapping only, once as template-requirements, as an item's, and accepts ITEM1.AREA_POINT (info.txt:9314; pantry's reading 163)",
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
      "[T-9] built-in maps nothing: a dotted map-response-point of ITEM1.numAttempts, and a dotted map-response of a timed ITEM1.duration, of ITEM1.1.numAttempts and of P.duration and SEC.duration, are refused once as undeclared-variable expecting a response (info.txt:9306, info.txt:9314; pantry's reading 163)",
      () =>
        Effect.gen(function* builtInMapsNothing() {
          const cases = [
            ["qti-map-response-point", "ITEM1.numAttempts", "false", "ITEM1"],
            ["qti-map-response", "ITEM1.duration", "true", "ITEM1"],
            ["qti-map-response", "ITEM1.1.numAttempts", "false", "ITEM1"],
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
      "[T-9] built-in maps nothing: a dotted map-response of an untimed item's ITEM1.duration is refused twice as undeclared-variable, the untimed duration and then the response it does not read (info.txt:9306; pantry's reading 163)",
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
                check: "untimed-duration",
                element: "qti-map-response",
                identifier: "ITEM1.duration",
              },
            },
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
      "built-in maps nothing in an item: a qti-map-response of numAttempts, and a qti-map-response-point of a timed item's duration, are refused as undeclared-variable expecting a response at the item's own document, and AREA_POINT is accepted (info.txt:9306, info.txt:9314; pantry's reading 163)",
      () =>
        Effect.gen(function* itemBuiltInMapsNothing() {
          const cases = [
            ["qti-map-response", "numAttempts", "false"],
            ["qti-map-response-point", "duration", "true"],
          ] as const;

          for (const [element, identifier, timeDependent] of cases) {
            assert.deepStrictEqual(
              refusalsOf(
                yield* openScoringPoints(timeDependent, `<${element} identifier="${identifier}"/>`),
              ),
              [
                {
                  detail: { element, expected: "response", identifier },
                  document: fileLocation(location, "items/a.xml"),
                  location: {
                    kind: "path",
                    path: `qti-assessment-item/qti-response-processing/qti-set-outcome-value/${element}`,
                  },
                  rule: "undeclared-variable",
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
      "[T-9] qti-correct reads a response: refuses ITEM1.SCORE, ITEM1.T and ITEM1.numAttempts, an outcome, a template variable and a built-in, once each as undeclared-variable expecting a response (info.txt:9302; G-R3, pending)",
      () =>
        Effect.gen(function* correctOfNoResponse() {
          for (const reference of ["ITEM1.SCORE", "ITEM1.T", "ITEM1.numAttempts"]) {
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
      "[T-9] controls for qti-correct reads a response: ITEM1.RESPONSE, a response, and a qti-default of ITEM1.SCORE are accepted, and an unresolvable ITEM9.RESPONSE keeps its one reading refusal (reading 48)",
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
      "[T-9] refuses a dotted rule target no reading resolves, ITEM9.SCORE set by qti-set-outcome-value or qti-lookup-outcome-value, as undeclared-variable, pantry's prefixed-ref (reading 48)",
      () =>
        Effect.gen(function* unresolvedTarget() {
          for (const element of ["qti-set-outcome-value", "qti-lookup-outcome-value"]) {
            const verdict = yield* openPackage(
              location,
              reachPackage(settingOne(element, "ITEM9.SCORE")),
            );
            assert.deepStrictEqual(
              refusalsOf(verdict),
              [
                {
                  detail: { check: "reading", element, identifier: "ITEM9.SCORE", reading: "48" },
                  document: fileLocation(location, "test.xml"),
                  location: { kind: "path", path: `${ruleAt(element)}/@identifier` },
                  rule: "undeclared-variable",
                },
              ],
              element,
            );
            assert.isTrue(acceptedAlone(verdict), element);
          }
        }),
    );

    it.effect(
      "[T-9] refuses a dotted rule target two readings resolve, ITEM1.X.SCORE beside item refs ITEM1 and ITEM1.X, as ambiguous-reference with both readings, pantry's prefixed-ref (reading 48)",
      () =>
        Effect.gen(function* ambiguousTarget() {
          const verdict = yield* openPackage(
            location,
            nestedRefsPackage(settingOne("qti-set-outcome-value", "ITEM1.X.SCORE")),
          );

          assert.deepStrictEqual(refusalsOf(verdict), [
            {
              detail: {
                firstPrefix: "ITEM1",
                firstVariable: "X.SCORE",
                reading: "48",
                reference: "ITEM1.X.SCORE",
                secondPrefix: "ITEM1.X",
                secondVariable: "SCORE",
              },
              document: fileLocation(location, "test.xml"),
              location: {
                kind: "path",
                path: `${ruleAt("qti-set-outcome-value")}/@identifier`,
              },
              rule: "ambiguous-reference",
            },
          ]);
          assert.isTrue(acceptedAlone(verdict));
        }),
    );

    it.effect(
      "[T-9] controls for a dotted rule target: ITEM1.SCORE, which resolves, is accepted, ITEM1.duration of an item that is not time dependent gets no untimed-duration, and the qti-variable forms of ITEM9.SCORE and ITEM1.X.SCORE are refused as before (reading 48)",
      () =>
        Effect.gen(function* dottedTargetControls() {
          acceptedOf(
            yield* openPackage(
              location,
              reachPackage(settingOne("qti-set-outcome-value", "ITEM1.SCORE")),
            ),
          );
          acceptedOf(
            yield* openPackage(
              location,
              reachPackage(settingOne("qti-set-outcome-value", "ITEM1.duration")),
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

    it.effect(
      "[T-9] accepts I1.SCORE and S2.duration that a section document in the reach holds, its item ref resolved from its own path, with the test's processing marked by name and its items its own (reading 48)",
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
      "[T-9] refuses I9.SCORE once, and I1.SCORE past a section ref whose href names no section resource, as a section document in the reach adds only what it holds (reading 48)",
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
            [unread("I1.SCORE")],
          );
        }),
    );

    it.effect(
      "[T-9] walks a section document in the reach once for two section refs to it, its own section ref to itself and a second test, giving its refusal once",
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
            refusalsOf(verdict).map((refusal) => [refusal.rule, refusal.document]),
            [["undeclared-variable", fileLocation(location, "sections/s2.xml")]],
          );
        }),
    );

    it.effect(
      "gives a verdict for a long chain of section refs, 8,000 section documents each naming the next, and does not throw (R5)",
      () => acceptsChain(8000),
      chainTimeoutMs,
    );

    it.effect(
      "gives the same verdict for a long chain of section refs of 3,000 section documents, the control",
      () => acceptsChain(3000),
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
      "[T-9] refuses a dotted name in a section document that none of the reaching test's readings resolve, judged under the reaching test, as undeclared-variable at the section document (reading 48)",
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
      "[T-9] controls for a section judged under the reaching test: reached by no test it keeps its own verdict, under two tests each refusal is given once, and a pre-condition over TOTAL or I1.SCORE is accepted",
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
      "[T-9] dotted lookup and pattern through the package: the lookup of ITEM1.SCORE from a string is refused once, as expression-type with reading 28, and an integer is accepted",
      () =>
        Effect.gen(function* lookupThroughPackage() {
          assert.deepStrictEqual(
            refusalsOf(
              yield* openLookingUp('<qti-base-value base-type="string">x</qti-base-value>'),
            ).map(({ detail, document, location: at, rule }) => [
              rule,
              detail["element"],
              detail["identifier"],
              detail["reading"],
              detail["table"],
              document,
              at,
            ]),
            [
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
          acceptedOf(
            yield* openLookingUp('<qti-base-value base-type="integer">1</qti-base-value>'),
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
      { tags: ["corpus"] },
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

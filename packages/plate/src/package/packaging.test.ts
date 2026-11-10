import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { openPackage } from "#plate/index.ts";
import type { AcceptedPackage, PackageResource, PackageVerdict } from "#plate/index.ts";

/**
 * The package's root directory, found from the entry module it exports.
 */
const packageDirectory = fileURLToPath(new URL("../", import.meta.resolve("#plate/index.ts")));

/**
 * The package the tests open, which is also the location every document and refusal of it carries:
 * an item bank of two single-Choice items, `items/one.xml` and `items/two.xml`, with no test, and
 * one LOM record, `metadata/one.lom.xml`, that its manifest lists as a `resourcemetadata/xml`
 * resource no other resource names. Its manifest is a 3.0.0 manifest whose root binds the prefixes
 * `lom`, `csmd`, `cpx` and `drd`, so a variant of it edits the manifest's text and nothing else.
 */
const fixtureLocation = "fixtures/m3f/packaging";

/**
 * The manifest's path in the package, and so in the map `openPackage` takes.
 */
const manifestPath = "imsmanifest.xml";

/**
 * The location of each item document of the fixture, the key `accepted.items` holds it under.
 */
const itemDocuments = [
  `${fixtureLocation}/items/one.xml`,
  `${fixtureLocation}/items/two.xml`,
] as const;

/**
 * The content packaging namespace of QTI 3.0, the namespace of the manifest's own elements.
 */
const cpNamespace = "http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1";

/**
 * The content packaging extension's namespace, which holds `variant`.
 */
const cpxNamespace = "http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_extensionv1p2";

/**
 * The curriculum standards metadata's namespace, which holds `curriculumStandardsMetadataSet` and
 * every element beneath it.
 */
const csmdNamespace = "http://www.imsglobal.org/xsd/qti/qtiv3p0/imscsmd_v1p1";

/**
 * The opening tag of the fixture's first item resource, which a variant of the manifest puts
 * `metadata` after.
 */
const itemOneOpening =
  '<resource identifier="item-one" type="imsqti_item_xmlv3p0" href="items/one.xml">';

/**
 * The opening tag of the fixture's second item resource.
 */
const itemTwoOpening =
  '<resource identifier="item-two" type="imsqti_item_xmlv3p0" href="items/two.xml">';

/**
 * The first item resource's `file`, which a `dependency` or a `variant` follows.
 */
const itemOneFile = '<file href="items/one.xml"/>';

/**
 * The manifest's `schemaversion`, which a variant of the manifest rewrites or follows.
 */
const schemaVersion = "<schemaversion>3.0.0</schemaversion>";

/**
 * One edit of the fixture manifest's text, which fails when the text it expects is not there.
 *
 * @param manifest The manifest's text before the edit.
 * @returns The manifest's text after it.
 */
type Edit = (manifest: string) => string;

/**
 * The prose a curriculum standards set labels its first identifier with.
 */
const standardLabel = "Freezing and boiling points";

/**
 * The two `labelledGUID` entries of an ordinary set: one with a label and one with only its
 * identifier.
 */
const twoStandards = `<csmd:labelledGUID><csmd:label>${standardLabel}</csmd:label><csmd:GUID>STD-PS-2-1</csmd:GUID></csmd:labelledGUID><csmd:labelledGUID><csmd:GUID>STD-PS-2-2</csmd:GUID></csmd:labelledGUID>`;

/**
 * One `labelledGUID` that writes a CASE item URI beside its identifier, the form CASE identifiers
 * take in a set. The URI is under `example.org`, which is reserved for examples and never fetched.
 */
const caseStandard = `<csmd:labelledGUID><csmd:label>${standardLabel}</csmd:label><csmd:caseItemURI>https://standards.example.org/ims/case/v1p0/CFItems/6b9f2f0e-5d3a-4c47-9a62-0d8e1c7b4a15</csmd:caseItemURI><csmd:GUID>6b9f2f0e-5d3a-4c47-9a62-0d8e1c7b4a15</csmd:GUID></csmd:labelledGUID>`;

/**
 * One `labelledGUID` that writes a label and no `GUID`, which its schema requires.
 */
const unidentifiedStandard = `<csmd:labelledGUID><csmd:label>${standardLabel}</csmd:label></csmd:labelledGUID>`;

/**
 * The LOM record a resource's own metadata writes beside a curriculum standards set. Its `general`
 * gives the identifier and title the first item document writes, as reading 62 requires of an
 * item's record.
 */
const itemOneLom =
  '<lom:lom><lom:general><lom:identifier><lom:entry>bank-one</lom:entry></lom:identifier><lom:title><lom:string language="en">Freezing point</lom:string></lom:title></lom:general></lom:lom>';

/**
 * A `variant` that names the second item resource as its alternative, its metadata an
 * `accessForAllResource` that states only a language.
 */
const variantOfItemTwo =
  '<cpx:variant identifier="variant-two" identifierref="item-two"><cpx:metadata><drd:accessForAllResource><drd:languageOfAdaptation>fr</drd:languageOfAdaptation></drd:accessForAllResource></cpx:metadata></cpx:variant>';

/**
 * The URL an external metadata resource names, which lies outside the package.
 */
const externalRecordUrl = "https://metadata.example.org/records/one.xml";

/**
 * A `resourceextmetadata/xml` resource whose `href` and one `file` are {@link externalRecordUrl}.
 */
const externalRecord = `<resource identifier="item-one-external" type="resourceextmetadata/xml" href="${externalRecordUrl}"><file href="${externalRecordUrl}"/></resource>`;

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
 * Write the edit that follows an anchor of the manifest with some text.
 *
 * @param anchor The text to follow, written once in the fixture's manifest.
 * @param addition What follows it.
 * @returns The edit.
 */
const after =
  (anchor: string, addition: string): Edit =>
  (manifest) =>
    replaced(manifest, anchor, `${anchor}${addition}`);

/**
 * Write the edit that gives a resource a `metadata` holding the given text, as the resource's
 * first child.
 *
 * @param opening The resource's opening tag.
 * @param metadata What the `metadata` holds.
 * @returns The edit.
 */
const withMetadata = (opening: string, metadata: string): Edit =>
  after(opening, `<metadata>${metadata}</metadata>`);

/**
 * Write the edit that gives the manifest's own `metadata` some text after its `schemaversion`.
 *
 * @param metadata What follows the `schemaversion`.
 * @returns The edit.
 */
const withManifestMetadata = (metadata: string): Edit => after(schemaVersion, metadata);

/**
 * Write the edit that names another profile in the manifest's `schemaversion`.
 *
 * @param version The profile, `3.0.0` or `3.0.1`.
 * @returns The edit.
 */
const withProfile =
  (version: "3.0.0" | "3.0.1"): Edit =>
  (manifest) =>
    replaced(manifest, schemaVersion, `<schemaversion>${version}</schemaversion>`);

/**
 * Write the edit that gives the first item resource a `dependency` on a resource.
 *
 * @param identifier The identifier of the resource it names.
 * @returns The edit.
 */
const dependingOn = (identifier: string): Edit =>
  after(itemOneFile, `<dependency identifierref="${identifier}"/>`);

/**
 * Write the edit that lists one more resource, the last of the manifest's.
 *
 * @param resource The resource's text.
 * @returns The edit.
 */
const listing =
  (resource: string): Edit =>
  (manifest) =>
    replaced(manifest, "</resources>", `${resource}</resources>`);

/**
 * Write a curriculum standards set, one `curriculumStandardsMetadata` holding one `setOfGUIDs`,
 * each with every optional attribute its schema names.
 *
 * @param entries The `labelledGUID` elements the `setOfGUIDs` holds.
 * @returns The set's text.
 */
const standardsSet = (entries: string): string =>
  `<csmd:curriculumStandardsMetadataSet resourceLabel="Item" resourcePartId="bank-one"><csmd:curriculumStandardsMetadata providerId="standards.example.org"><csmd:setOfGUIDs region="XX" version="2026">${entries}</csmd:setOfGUIDs></csmd:curriculumStandardsMetadata></csmd:curriculumStandardsMetadataSet>`;

/**
 * Open the fixture package, its manifest edited first, with every other file as it is.
 *
 * @param edits The edits to make to the manifest's text, in order; none opens the fixture itself.
 * @returns The verdict on the package.
 */
const openBank = Effect.fnUntraced(function* openBank(...edits: readonly Edit[]) {
  const files = new Map(yield* filesOf(path.join(packageDirectory, fixtureLocation)));
  const manifest = files.get(manifestPath);
  assert.isDefined(manifest, "the fixture has an imsmanifest.xml");

  let text = new TextDecoder().decode(manifest);
  for (const edit of edits) {
    text = edit(text);
  }
  files.set(manifestPath, new TextEncoder().encode(text));

  return yield* openPackage(fixtureLocation, files);
});

/**
 * Give the rules of a package verdict's refusals, in order; none when it does not refuse.
 *
 * @param verdict The package verdict.
 * @returns Each refusal's rule.
 */
const rulesOf = (verdict: PackageVerdict): readonly string[] =>
  verdict.verdict === "refused" ? verdict.refusals.map((refusal) => refusal.rule) : [];

/**
 * Take the accepted package of a verdict that is `accepted`, the verdict without a mark; the test
 * fails otherwise, naming the refusals' rules.
 *
 * @param verdict The package verdict.
 * @returns The accepted package.
 */
const acceptedOf = (verdict: PackageVerdict): AcceptedPackage =>
  verdict.verdict === "accepted"
    ? verdict.accepted
    : assert.fail(
        `${verdict.location} is ${verdict.verdict}, not accepted: ${rulesOf(verdict).join(", ")}`,
      );

/**
 * Take the accepted package of a verdict, failing unless it keeps the whole item bank: both items
 * under their document locations, and no test.
 *
 * @param verdict The package verdict.
 * @returns The accepted package.
 */
const keptBank = (verdict: PackageVerdict): AcceptedPackage => {
  const accepted = acceptedOf(verdict);

  assert.deepStrictEqual([...accepted.items.keys()].toSorted(), [...itemDocuments]);
  assert.strictEqual(accepted.tests.size, 0, "an item bank holds no test");

  return accepted;
};

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
 * Give the path a refusal points at in its document, `""` when it points at no element.
 *
 * @param verdict The package verdict, which must be refused.
 * @returns The path of each refusal, in order.
 */
const pathsOf = (verdict: PackageVerdict): readonly string[] =>
  verdict.verdict === "refused"
    ? verdict.refusals.map((refusal) =>
        refusal.location.kind === "path" ? refusal.location.path : "",
      )
    : [];

describe("the remaining packaging rows", () => {
  it.effect("[P-3] an item bank, items and no test, is accepted and delivers each item", () =>
    Effect.gen(function* checkBank() {
      const accepted = keptBank(yield* openBank());

      assert.strictEqual(accepted.version, "3.0.0");
    }),
  );

  it.effect("[P-3] an item of the bank is delivered as it would be alone", () =>
    Effect.gen(function* checkItems() {
      const { items } = keptBank(yield* openBank());
      const [one, two] = itemDocuments.map(
        (document) => items.get(document) ?? assert.fail(`the bank holds no item ${document}`),
      );

      assert.deepStrictEqual(
        [one?.item.identifier, one?.item.title, two?.item.identifier, two?.item.title],
        ["bank-one", "Freezing point", "bank-two", "Largest planet"],
      );
      assert.deepStrictEqual(
        [one?.document, two?.document],
        [...itemDocuments],
        "each item is judged at its own document",
      );
    }),
  );

  it.effect(
    "[P-8] a curriculum standards set in a resource's metadata is accepted beside its LOM",
    () =>
      Effect.gen(function* checkResourceSet() {
        const verdict = yield* openBank(
          withMetadata(itemOneOpening, `${standardsSet(twoStandards)}${itemOneLom}`),
        );
        keptBank(verdict);

        const { lom } = resourceOf(verdict, "item-one").metadata;

        assert.deepStrictEqual(
          lom.map((general) => general.title.pipe(Option.map((title) => [...title.values]))),
          [Option.some(["Freezing point"])],
          "the LOM beside the set is still read",
        );
      }),
  );

  it.effect("[P-8] a curriculum standards set in the manifest's own metadata is accepted", () =>
    Effect.gen(function* checkManifestSet() {
      keptBank(yield* openBank(withManifestMetadata(standardsSet(twoStandards))));
    }),
  );

  it.effect(
    "[P-8] a curriculum standards set holding an element its schema does not name is refused, so the annotations are read",
    () =>
      Effect.gen(function* checkStrayElement() {
        const verdict = yield* openBank(
          withMetadata(
            itemOneOpening,
            standardsSet(`${twoStandards}<csmd:identifier>STD-PS-2-3</csmd:identifier>`),
          ),
        );

        assert.deepStrictEqual(rulesOf(verdict), ["unknown-element"]);
        assert.deepStrictEqual(pathsOf(verdict), [
          `{${cpNamespace}}manifest/{${cpNamespace}}resources/{${cpNamespace}}resource[1]/{${cpNamespace}}metadata/{${csmdNamespace}}curriculumStandardsMetadataSet/{${csmdNamespace}}curriculumStandardsMetadata/{${csmdNamespace}}setOfGUIDs/{${csmdNamespace}}identifier`,
        ]);
      }),
  );

  // A pin of a gap, not of a rule: a `labelledGUID` with no `GUID` is out of its schema, and
  // `readManifest` still accepts it, because `checkCounts` (`#plate/package/manifest.ts`) counts
  // the children of the manifest's own elements and LOM's only. A fix turns this verdict to
  // `refused`, and the test then takes the row's tag.
  it.effect(
    "a labelledGUID with no GUID, which its schema requires, is accepted: a finding, so the test carries no row",
    () =>
      Effect.gen(function* checkMissingGuid() {
        keptBank(yield* openBank(withMetadata(itemOneOpening, standardsSet(unidentifiedStandard))));
      }),
  );

  it.effect(
    "[P-9] a resource of type resourcemetadata/xml holding the package's LOM file is accepted and its file kept",
    () =>
      Effect.gen(function* checkRecord() {
        const verdict = yield* openBank(dependingOn("item-one-record"));
        const accepted = keptBank(verdict);

        assert.isTrue(accepted.files.has("metadata/one.lom.xml"));
        assert.deepStrictEqual(
          resourceOf(verdict, "item-one-record").path,
          Option.some("metadata/one.lom.xml"),
        );
        assert.deepStrictEqual(
          rulesOf(yield* openBank(dependingOn("item-one-missing"))),
          ["dependency-unresolved"],
          "the dependency is read: one that names no resource is refused",
        );
      }),
  );

  it.effect(
    "[P-9] a resource of type resourceextmetadata/xml whose href names a file outside the package is accepted and never fetched",
    () =>
      Effect.gen(function* checkExternal() {
        const baseline = acceptedOf(yield* openBank());
        const verdict = yield* openBank(dependingOn("item-one-external"), listing(externalRecord));
        const accepted = keptBank(verdict);
        const record = resourceOf(verdict, "item-one-external");

        assert.strictEqual(record.type, "resourceextmetadata/xml");
        assert.isTrue(Option.isNone(record.path), "the record names no file of the package");
        assert.deepStrictEqual(
          [...accepted.files].toSorted(),
          [...baseline.files].toSorted(),
          "the package holds no path for the record",
        );
        assert.isFalse(
          [...accepted.files].some((file) => file.includes(externalRecordUrl)),
          "the URL is not kept as a file",
        );
      }),
  );

  it.effect("[P-12] a variant under the 3.0.0 profile is accepted", () =>
    Effect.gen(function* checkVariant() {
      keptBank(yield* openBank(after(itemOneFile, variantOfItemTwo)));
    }),
  );

  it.effect(
    "[P-12] the same variant under the 3.0.1 profile is refused, as that profile admits none",
    () =>
      Effect.gen(function* checkProfile() {
        keptBank(yield* openBank(withProfile("3.0.1")));

        const verdict = yield* openBank(withProfile("3.0.1"), after(itemOneFile, variantOfItemTwo));

        assert.deepStrictEqual(rulesOf(verdict), ["child-count"]);
        assert.deepStrictEqual(pathsOf(verdict), [
          `{${cpNamespace}}manifest/{${cpNamespace}}resources/{${cpNamespace}}resource[1]`,
        ]);
        assert.deepStrictEqual(
          verdict.verdict === "refused"
            ? verdict.refusals.map((refusal) => refusal.detail["child"])
            : [],
          [`{${cpxNamespace}}variant`],
          "the refusal counts the variants its resource holds",
        );
      }),
  );

  it.effect(
    "[P-13] CASE identifiers on an item, as a curriculum standards set with caseItemURI, are accepted",
    () =>
      Effect.gen(function* checkItemCase() {
        keptBank(yield* openBank(withMetadata(itemOneOpening, standardsSet(caseStandard))));
      }),
  );

  it.effect(
    "[P-13] CASE identifiers on the manifest and on two resources at once are accepted",
    () =>
      Effect.gen(function* checkEverywhereCase() {
        keptBank(
          yield* openBank(
            withManifestMetadata(standardsSet(caseStandard)),
            withMetadata(itemOneOpening, standardsSet(caseStandard)),
            withMetadata(itemTwoOpening, standardsSet(caseStandard)),
          ),
        );
      }),
  );
});

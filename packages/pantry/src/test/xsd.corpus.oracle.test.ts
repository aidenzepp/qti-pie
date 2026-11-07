/**
 * The XSD's own validator against the law oracle, on every corpus document in both schema
 * versions (slice A2).
 *
 * Oracle: a second implementation. libxml2's XML Schema validator (`xmllintValidate`) judges each
 * document against the pinned XSDs of a version, through the catalog and drivers of
 * `#pantry/test/xsd-catalog.ts`, sharing no code with the grammar; the law oracle
 * (`#pantry/test/oracle.ts`) judges the same bytes in the same version by the grammar's laws.
 * Each document is judged in both versions, whatever its package declares, so each version's XSD
 * is compared with the grammar of that version on every document. The two are compared class by
 * class (`compareJudgments`), and every difference is either recorded below ({@link recorded}),
 * each with its reason, or the test fails: a difference is a bug in one of the two oracles, a
 * spec reading that departs from the XSD on purpose, or a limit of libxml2. A record no
 * difference matches any more fails too, so the records stay the exact list of what differs.
 *
 * The comparison's contract is per document and per class, not per message: the law oracle stops
 * at the reader's, the codec's or a fold's first refusal, so what `xmllint` says beyond it is
 * counted as masked rather than as a difference.
 *
 * Gated on `GR8DES_CORPUS=1` and on the XSD cache. It writes, under a folder of the run's own,
 * `work/xsd-corpus-*` (`#pantry/test/scratch.ts`), removed after the file's last test: `files/`
 * (the documents), `agreement.tsv` (one row per document and version) and `differences.tsv` (one
 * row per difference, with the record that classifies it). Each folder this file writes is the
 * run's own, so two runs at once never remove each other's documents under xmllint.
 */
import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, describe, it as unit, layer } from "@effect/vitest";
import { Console, Effect, FileSystem, Layer } from "effect";
import { Digest } from "effect/crypto";
import { composed } from "#pantry/grammar/compose.ts";
import { schemaVersions } from "#pantry/grammar/kinds.ts";
import type { SchemaVersion } from "#pantry/grammar/kinds.ts";
import { readPackage } from "#pantry/package/read.ts";
import { materializeCorpus } from "#pantry/test/fixtures.ts";
import { lawsOf } from "#pantry/test/oracle.ts";
import { fileScratchDirectory } from "#pantry/test/scratch.ts";
import { settings } from "#pantry/test/settings.ts";
import { compareJudgments, schemaSetOf, writeXsdOracle } from "#pantry/test/xsd-catalog.ts";
import type { Comparison, Difference } from "#pantry/test/xsd-catalog.ts";
import {
  absentTypeRecord,
  base64Record,
  blankListRecord,
  emptyIdrefsRecord,
  foreignNamesOf,
  isLaxXsiType,
  isNestedRoot,
  isNestedRootLaw,
  judgeDocument,
  laxNilRecord,
  laxXsiType,
  libxml2Count,
  libxml2Records,
  locationRecord,
  nestedRoot,
  nestedRootLaw,
  paddedTypeRecord,
  reasonText,
  recordOf,
  recorded,
  validated,
} from "#pantry/test/xsd-differential.ts";
import type { Recorded } from "#pantry/test/xsd-differential.ts";
import { checkCache } from "#pantry/vocab/derive/sources.ts";
import { OracleLayer, xmllintValidate } from "#pantry/xml/oracle.ts";

/**
 * The folder the corpus comparison writes to, `packages/pantry/work/xsd-corpus-*`, the run's own.
 */
const outputRoot = fileScratchDirectory("xsd-corpus-");

/**
 * The folder the oracle's driver schemas and catalog are written to, `work/xsd-oracle-*`, the
 * run's own.
 */
const oracleRoot = fileScratchDirectory("xsd-oracle-");

/**
 * The timeout, in milliseconds, for the one test: two `xmllint` runs over every corpus document
 * (one per version, each compiling its version's XSDs once) and the law oracle over every document
 * in both versions.
 *
 * Measured on 2026-11-05: each `xmllint` run over the 380 documents took 16.4 s of wall time at a
 * load average near 30 (3.4 s of CPU). Measured 2026-11-07: 168.2 s at a load average of 63 to
 * 78, the whole test, under `GR8DES_CORPUS=1`. The budget is twice that, rounded up to the next
 * minute. Raise it only on a new measurement recorded here, never to make a run pass.
 */
const testTimeoutMs = 360_000;

/**
 * Whether the XSD cache holds every pin, so `xmllint` can read them.
 */
const cached = await Effect.runPromise(
  checkCache().pipe(
    Effect.as(true),
    Effect.catchTag("XsdSourceMissing", () => Effect.succeed(false)),
    Effect.provide(NodeServices.layer),
  ),
);

/**
 * The services the test reads and spawns with.
 */
const TestLayer = Layer.mergeAll(
  NodeServices.layer,
  Digest.layerWebCrypto,
  OracleLayer.pipe(Layer.provide(NodeServices.layer)),
);

/**
 * One corpus document: the zip it is in, its path in the zip, the version its package declares,
 * its bytes, and where it was written for `xmllint`.
 */
interface CorpusDocument {
  readonly bytes: Uint8Array;
  readonly declared: string;
  readonly file: string;
  readonly path: string;
  readonly zip: string;
}

/**
 * One document's judgment in one version, compared, and the record each difference matched.
 */
interface Judged {
  readonly comparison: Comparison;
  readonly document: CorpusDocument;
  readonly matches: readonly (Recorded | undefined)[];
  readonly version: SchemaVersion;
}

/**
 * Write rows as TSV: a header, then one line per row, each field's tabs and line breaks spaced
 * out.
 *
 * @param header - The column names.
 * @param rows - The rows.
 * @returns The text.
 */
const tsv = (header: readonly string[], rows: readonly (readonly string[])[]): string =>
  [header, ...rows]
    .map((row) => `${row.map((field) => field.replaceAll(/[\t\r\n]+/gu, " ")).join("\t")}\n`)
    .join("");

/**
 * Read the schema version a manifest declares, for the report: the text of its first
 * `schemaversion` element.
 *
 * @param bytes - The manifest's bytes.
 * @returns The version as written, or empty when it declares none.
 */
const declaredOf = (bytes: Uint8Array): string =>
  /<(?:\w+:)?schemaversion>\s*(?<version>[^<]*?)\s*</u.exec(new TextDecoder().decode(bytes))
    ?.groups?.["version"] ?? "";

/**
 * Read every XML document of the corpus and write each where `xmllint` reads it.
 *
 * @returns The documents, in corpus order.
 */
const corpusDocuments = Effect.fn("xsd.corpusDocuments")(function* corpusDocuments() {
  const fs = yield* FileSystem.FileSystem;
  const corpus = yield* materializeCorpus();
  const documents: CorpusDocument[] = [];

  for (const entry of corpus) {
    const files = yield* readPackage(entry.dir);
    const manifest = files.find(({ kind }) => kind === "manifest");
    const declared = manifest === undefined ? "" : declaredOf(manifest.bytes);

    for (const file of files.filter(({ path: at }) => at.toLowerCase().endsWith(".xml"))) {
      const written = `${outputRoot}/files/${entry.name}/${file.path}`;

      yield* fs.makeDirectory(path.dirname(written), { recursive: true });
      yield* fs.writeFile(written, file.bytes);
      documents.push({
        bytes: file.bytes,
        declared,
        file: written,
        path: file.path,
        zip: entry.name,
      });
    }
  }

  return documents;
});

describe.skipIf(!settings.corpusRequested || !cached)(
  "xsd.corpus.oracle.test.ts, the corpus",
  () => {
    layer(TestLayer, { excludeTestServices: true })("xmllint against the law oracle", (it) => {
      it.effect(
        "every corpus document's two verdicts, per class, differ only as recorded",
        () =>
          Effect.gen(function* compareCorpus() {
            const fs = yield* FileSystem.FileSystem;
            const grammar = yield* Effect.fromResult(composed()).pipe(Effect.orDie);
            const laws = lawsOf(grammar);

            yield* fs.remove(outputRoot, { force: true, recursive: true });

            const documents = yield* corpusDocuments();
            const oracle = yield* writeXsdOracle(oracleRoot);
            const judged: Judged[] = [];

            for (const version of schemaVersions) {
              const verdicts = yield* validated(oracle, version, documents);

              for (const [at, document] of documents.entries()) {
                const xsd =
                  verdicts[at] ??
                  (yield* Effect.die(new Error(`xmllint gave no verdict for ${document.file}`)));

                const law = yield* judgeDocument({
                  bytes: document.bytes,
                  grammar,
                  laws,
                  path: document.path,
                  version,
                });
                const comparison = compareJudgments(xsd, law);

                judged.push({
                  comparison,
                  document,
                  matches: comparison.differences.map((difference) =>
                    recordOf(document, version, difference, [...recorded, ...libxml2Records]),
                  ),
                  version,
                });
              }
            }

            yield* fs.writeFileString(
              `${outputRoot}/agreement.tsv`,
              tsv(
                [
                  "zip",
                  "document",
                  "declared",
                  "version",
                  "verdicts",
                  "xmllint",
                  "laws",
                  "masked",
                  "differences",
                ],
                judged.map(({ comparison, document, version }) => [
                  document.zip,
                  document.path,
                  document.declared,
                  version,
                  comparison.verdicts,
                  comparison.xsdClasses.join(" "),
                  comparison.lawClasses.join(" "),
                  comparison.masked.join(" "),
                  String(comparison.differences.length),
                ]),
              ),
            );
            yield* fs.writeFileString(
              `${outputRoot}/differences.tsv`,
              tsv(
                ["zip", "document", "version", "direction", "class", "rule", "record", "detail"],
                judged.flatMap(({ comparison, document, matches, version }) =>
                  comparison.differences.map((difference, at) => {
                    const match = matches[at];

                    return [
                      document.zip,
                      document.path,
                      version,
                      difference.direction,
                      difference.class,
                      difference.rule,
                      match === undefined ? "UNRECORDED" : reasonText(match.reason),
                      difference.detail.slice(0, 600),
                    ];
                  }),
                ),
              ),
            );

            const tally = (verdicts: Comparison["verdicts"]) =>
              judged.filter(({ comparison }) => comparison.verdicts === verdicts).length;
            const unrecorded = judged.flatMap(({ comparison, document, matches, version }) =>
              comparison.differences.flatMap((difference, at) =>
                matches[at] === undefined
                  ? [
                      `${document.zip}/${document.path} ${version} ${difference.direction} ${difference.class} ${difference.rule}: ${difference.detail.slice(0, 300)}`,
                    ]
                  : [],
              ),
            );
            const used = new Set(judged.flatMap(({ matches }) => matches));
            const stale = recorded.filter((record) => !used.has(record));

            yield* Console.log(
              [
                `xsd.corpus: ${String(documents.length)} documents x ${String(schemaVersions.length)} versions = ${String(judged.length)} judgments`,
                `  accepted by both ${String(tally("accepted by both"))}, refused by both ${String(tally("refused by both"))}, xmllint only ${String(tally("xmllint only"))}, laws only ${String(tally("laws only"))}`,
                `  differences ${String(judged.reduce((sum, { comparison }) => sum + comparison.differences.length, 0))}, unrecorded ${String(unrecorded.length)}, stale records ${String(stale.length)}, libxml2 ${String(libxml2Count(judged.flatMap(({ matches }) => matches)))} (${libxml2Records.map(({ reason }) => reasonText(reason)).join("; ")})`,
              ].join("\n"),
            );

            assert.deepStrictEqual(
              unrecorded,
              [],
              "every difference between the two oracles is recorded",
            );
            assert.deepStrictEqual(
              stale.map(
                ({ class: cls, direction, reason }) => `${direction} ${cls}: ${reasonText(reason)}`,
              ),
              [],
              "every record still matches a difference",
            );
          }),
        { timeout: testTimeoutMs },
      );
    });
  },
);

/**
 * The timeout, in milliseconds, for the libxml2 control: one `xmllint` run over four small
 * documents, which compiles the 3.0.0 XSDs once. Measured on 2026-11-05 under the shared tree's
 * load: over 5 s. Measured 2026-11-07: 35.6 s at a load average of 63 to 73, and 34.4 s at 70 to
 * 74, so the hang guard is 90 s. Raise it only on a new measurement recorded here.
 */
const controlTimeoutMs = 90_000;

/**
 * The folder the libxml2 control writes to, `packages/pantry/work/xsd-control-*`, the run's own.
 */
const controlRoot = fileScratchDirectory("xsd-control-");

/**
 * An item with the given companion materials and item-body content, every attribute it needs.
 *
 * @param companion - The `qti-companion-materials-info` children, none for no element.
 * @param body - The item body's content.
 * @returns The item's text.
 */
const controlItem = (companion: string, body: string): string =>
  `<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="i" title="t" time-dependent="false" adaptive="false">${
    companion === ""
      ? ""
      : `<qti-companion-materials-info>${companion}</qti-companion-materials-info>`
  }<qti-item-body>${body}</qti-item-body></qti-assessment-item>`;

/**
 * `figcaption` beneath SSML's `mark`, whose content is a `##other` lax wildcard: a globally
 * declared element there is validated (Part 1, 3.10.4), so its attributes are typed.
 *
 * @param attributes - The `figcaption` elements, each as its attributes.
 * @returns The companion materials' content.
 */
const underMark = (...attributes: readonly string[]): string =>
  `<ssml:mark xmlns:ssml="http://www.w3.org/2001/10/synthesis" name="m">${attributes
    .map((held) => `<figcaption ${held}>x</figcaption>`)
    .join("")}</ssml:mark>`;

/**
 * An item whose companion materials hold an SSML `mark`, whose content is a `##other` lax
 * wildcard, holding the given content, with the `xsi` prefix bound. The item's schema set holds
 * the ASI XSD, MathML and SSML (spec reading 81), so a global element of either beneath the mark is
 * assessed against its declaration, and an element no XSD of the set declares against nothing.
 *
 * @param content - The mark's content, as written, in the ASI namespace unless it says otherwise.
 * @returns The item's text.
 */
const markedItem = (content: string): string =>
  controlItem(
    `<ssml:mark xmlns:ssml="http://www.w3.org/2001/10/synthesis" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" name="m">${content}</ssml:mark>`,
    "<p>x</p>",
  );

/**
 * A test whose one part carries the given attribute, every attribute it needs besides.
 *
 * @param attribute - The attribute, as written.
 * @returns The test's text.
 */
const locatedTest = (attribute: string): string =>
  `<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" identifier="T" title="t"><qti-test-part identifier="P" navigation-mode="linear" submission-mode="individual" ${attribute}><qti-assessment-section identifier="S" title="s" visible="true"><qti-assessment-item-ref identifier="I" href="i.xml"/></qti-assessment-section></qti-test-part></qti-assessment-test>`;

/**
 * A test whose one section's selection carries the given attribute, every attribute it needs
 * besides. The Schematron's extension rules cover `qti-test-part` and not `qti-selection`, so an
 * `xml:` name `qti-selection`'s `##other` wildcard admits is still read by its declaration there,
 * where spec reading 90 refuses one on the test part outright.
 *
 * @param attribute - The attribute, as written.
 * @returns The test's text.
 */
const selectedTest = (attribute: string): string =>
  `<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="T" title="t"><qti-test-part identifier="P" navigation-mode="linear" submission-mode="individual"><qti-assessment-section identifier="S" title="s" visible="true"><qti-selection select="1" ${attribute}/><qti-assessment-item-ref identifier="I" href="i.xml"/></qti-assessment-section></qti-test-part></qti-assessment-test>`;

/**
 * Response processing that holds one `qti-exit-response`, with the `xsi` prefix and `t` for the QTI
 * namespace in scope.
 *
 * @param exit - The `qti-exit-response`, as written.
 * @returns The processing's text.
 */
const exitProcessing = (exit: string): string =>
  `<qti-response-processing xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:t="http://www.imsglobal.org/xsd/imsqtiasi_v3p0">${exit}</qti-response-processing>`;

/**
 * Write control documents under the control folder, validate them with `xmllint` against the 3.0.0
 * XSDs, and judge them with the law oracle.
 *
 * @param folder - The control folder's subfolder to write them to.
 * @param documents - Each document's text by name.
 * @returns Each document's comparison and the records its differences match, in order.
 */
const controlled = Effect.fn("test.controlled")(function* controlled(
  folder: string,
  documents: Readonly<Record<string, string>>,
) {
  const fs = yield* FileSystem.FileSystem;
  const grammar = yield* Effect.fromResult(composed()).pipe(Effect.orDie);
  const laws = lawsOf(grammar);
  const directory = `${controlRoot}/${folder}`;

  yield* fs.remove(directory, { force: true, recursive: true });
  yield* fs.makeDirectory(directory, { recursive: true });

  const written = Object.entries(documents).map(([name, text]) => ({
    bytes: new TextEncoder().encode(text),
    file: `${directory}/${name}.xml`,
    name,
  }));
  for (const { bytes, file } of written) {
    yield* fs.writeFile(file, bytes);
  }

  const oracle = yield* writeXsdOracle(oracleRoot);
  const verdicts = yield* validated(oracle, "3.0.0", written);

  return yield* Effect.forEach(
    written,
    ({ bytes, file, name }, at) =>
      Effect.gen(function* compared() {
        const xsd = verdicts[at] ?? (yield* Effect.die(new Error(`no verdict for ${file}`)));
        const law = yield* judgeDocument({ bytes, grammar, laws, path: file, version: "3.0.0" });
        const comparison = compareJudgments(xsd, law);
        const names = yield* foreignNamesOf(bytes, "3.0.0", grammar);
        const document: CorpusDocument = {
          bytes,
          declared: "3.0.0",
          file,
          path: `${name}.xml`,
          zip: "control",
        };

        return {
          comparison,
          records: comparison.differences.map((difference) => {
            if (isNestedRoot(difference, names.nested)) {
              return nestedRoot;
            }

            if (isNestedRootLaw(difference, names.nestedPaths)) {
              return nestedRootLaw;
            }

            return isLaxXsiType(difference, new Set([...names.lax, ...names.outside]))
              ? laxXsiType
              : recordOf(document, "3.0.0", difference, libxml2Records);
          }),
        };
      }),
    { concurrency: 1 },
  );
});

describe.skipIf(!cached)(
  "xsd.corpus.oracle.test.ts, the libxml2 classes and reading 6 on their controls, and xmllint on a retyped element",
  () => {
    layer(TestLayer, { excludeTestServices: true })("the control", (it) => {
      it.effect(
        "libxml2 refuses a repeated ID in item-body content and under ssml:mark/figcaption, and accepts a dangling IDREF in both",
        () =>
          Effect.gen(function* control() {
            const fs = yield* FileSystem.FileSystem;
            const documents = {
              "body-dangling-idref": controlItem("", `<p aria-errormessage="nowhere">x</p>`),
              "body-repeated-id": controlItem("", `<p id="d1">x</p><p id="d1">y</p>`),
              "mark-dangling-idref": controlItem(
                underMark(`aria-errormessage="nowhere"`),
                "<p>x</p>",
              ),
              "mark-repeated-id": controlItem(underMark(`id="d1"`, `id="d1"`), "<p>x</p>"),
            };

            yield* fs.remove(controlRoot, { force: true, recursive: true });
            yield* fs.makeDirectory(controlRoot, { recursive: true });

            const files = Object.keys(documents).map((name) => `${controlRoot}/${name}.xml`);
            for (const [name, text] of Object.entries(documents)) {
              yield* fs.writeFileString(`${controlRoot}/${name}.xml`, text);
            }

            const oracle = yield* writeXsdOracle(oracleRoot);
            const verdicts = yield* xmllintValidate({
              catalog: oracle.catalog,
              paths: files,
              schema: oracle.drivers["3.0.0"],
            });

            assert.deepStrictEqual(
              verdicts.map(({ _tag }) => _tag),
              ["Valid", "Invalid", "Valid", "Invalid"],
              "a dangling IDREF validates and a repeated ID does not, in item-body content and under the lax wildcard alike",
            );
          }),
        { timeout: controlTimeoutMs },
      );

      it.effect(
        "each document root's schema set, read from the XSDs' own imports, is reading 81's",
        () =>
          Effect.gen(function* schemaSets() {
            const asi = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";
            const cp = "http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1";
            const lom = "http://ltsc.ieee.org/xsd/LOM";
            const usage = "http://www.imsglobal.org/xsd/imsqti_usagedata_v3p0";
            const xml = "http://www.w3.org/XML/1998/namespace";
            const sets = yield* Effect.forEach(
              schemaVersions.flatMap((version) =>
                [asi, cp, lom, usage].map((root) => [version, root] as const),
              ),
              ([version, root]) =>
                Effect.map(schemaSetOf(version, root), (set) => [...set].toSorted()),
              { concurrency: 1 },
            );
            const expected = [
              [
                asi,
                "http://www.w3.org/1998/Math/MathML",
                "http://www.w3.org/2001/10/synthesis",
                "http://www.w3.org/2001/XInclude",
                xml,
              ],
              [
                lom,
                "http://www.imsglobal.org/xsd/imsqti_metadata_v3p0",
                "http://www.imsglobal.org/xsd/qti/qtiv3p0/imsafa3p0drd_v1p0",
                "http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_extensionv1p2",
                cp,
                "http://www.imsglobal.org/xsd/qti/qtiv3p0/imscsmd_v1p1",
                "http://www.w3.org/1999/xlink",
                xml,
              ],
              [lom],
              [usage],
            ].map((set) => set.toSorted());

            assert.deepStrictEqual(
              sets,
              [...expected, ...expected],
              "an item's set is the ASI XSD with xml, XInclude, MathML and SSML; a manifest's the CP XSD with xml, LOM, the curriculum standards and QTI metadata, and the CP extension with XLink and the DRD; a LOM file's and a usage data file's their XSD alone",
            );
          }),
        { timeout: controlTimeoutMs },
      );

      it.effect(
        "each libxml2 record matches its control's difference, and the nearest value both oracles refuse makes none",
        () =>
          Effect.gen(function* libxml2Controls() {
            const bytes = (value: string) =>
              controlItem(
                "",
                `<p><math xmlns="http://www.w3.org/1998/Math/MathML"><cbytes>${value}</cbytes></math></p>`,
              );
            const held = yield* controlled("libxml2", {
              "base64-short": bytes("zz"),
              "base64-stray": bytes("QUFh&lt;"),
              "idrefs-empty": controlItem("", `<p id="a" aria-labelledby="">x</p>`),
              "idrefs-whole": controlItem("", `<p id="a" aria-labelledby="a">x</p>`),
              "list-blank": markedItem(
                `<widget xmlns="urn:w" xmlns:xs="http://www.w3.org/2001/XMLSchema" xsi:type="xs:NMTOKENS"> </widget>`,
              ),
              "list-whole": markedItem(
                `<widget xmlns="urn:w" xmlns:xs="http://www.w3.org/2001/XMLSchema" xsi:type="xs:NMTOKENS">a b</widget>`,
              ),
              "location-base": selectedTest(`xml:base="a]b"`),
              "location-no-namespace": locatedTest(`xsi:noNamespaceSchemaLocation="a]b"`),
              "location-pairs": locatedTest(`xsi:schemaLocation="urn:a a]b"`),
              "nil-lax": markedItem(`<widget xmlns="urn:w" xsi:nil="v">x</widget>`),
              "nil-lax-true": markedItem(`<widget xmlns="urn:w" xsi:nil="true">x</widget>`),
              "type-padded": exitProcessing(
                `<qti-exit-response xsi:type=" t:EmptyPrimitiveTypeDType&#x9;"/>`,
              ),
              "type-unknown": markedItem(
                `<widget xmlns="urn:w" xmlns:x="urn:x" xsi:type="x:v">x</widget>`,
              ),
              "type-unpadded": exitProcessing(
                `<qti-exit-response xsi:type="t:EmptyPrimitiveTypeDType"/>`,
              ),
            });

            assert.deepStrictEqual(
              held.map(({ comparison }) => comparison.verdicts),
              [
                "refused by both",
                "laws only",
                "laws only",
                "accepted by both",
                "laws only",
                "accepted by both",
                "refused by both",
                "laws only",
                "laws only",
                "laws only",
                "accepted by both",
                "xmllint only",
                "xmllint only",
                "accepted by both",
              ],
              "xmllint refuses a base64 value of two letters and xml:base's value, as the law oracle does, and accepts a stray character in base64, an empty IDREFS, a blank NMTOKENS element, the two xsi: locations' values and a lax xsi:nil's, which the law oracle refuses; it refuses a padded xsi:type, whose QName collapses to one it accepts unpadded, and an xsi:type naming no type on a lax element, which the law oracle accepts (reading 60)",
            );
            assert.deepStrictEqual(
              held.map(({ records }) => records),
              [
                [],
                [base64Record],
                [emptyIdrefsRecord],
                [],
                [blankListRecord],
                [],
                [],
                [locationRecord],
                [locationRecord],
                [laxNilRecord],
                [],
                [paddedTypeRecord],
                [laxXsiType, absentTypeRecord],
                [],
              ],
              "each libxml2 record matches exactly its control's differences, and reading 60's the unresolved xsi:type's",
            );
          }),
        { timeout: controlTimeoutMs },
      );

      it.effect(
        "a QTI root nested in an item's lax wildcard content: xmllint assesses it, and the law oracle keeps it foreign (reading 6)",
        () =>
          Effect.gen(function* nested() {
            const held = yield* controlled("nested", {
              "nested-bare": markedItem("<qti-assessment-item>x</qti-assessment-item>"),
              "nested-whole": markedItem(
                `<qti-assessment-item identifier="i" title="t" time-dependent="false"/>`,
              ),
            });

            assert.deepStrictEqual(
              held.map(({ comparison }) => [comparison.verdicts, comparison.xsdClasses]),
              [
                ["xmllint only", ["attribute-required", "content"]],
                ["accepted by both", []],
              ],
              "xmllint refuses the bare nested item's missing attributes and its text, and accepts the whole one",
            );
            assert.deepStrictEqual(
              held.map(({ records }) => records),
              [[nestedRoot, nestedRoot], []],
              "reading 6's class matches every difference the nested item makes",
            );
          }),
        { timeout: controlTimeoutMs },
      );

      // Two defects the law oracle shares with the grammar and the codec, left unrecorded, so a
      // generated document that shows one fails the generated test until its owner's fix lands;
      // this control states xmllint's verdict alone. An element an xsi:type retypes is assessed
      // against the type it names (XML Schema 1.0 Part 1, 3.3.4, cvc-elt clause 4, as reading 47
      // has it), so its attributes are that type's, but the grammar's attribute admission is by
      // kind, so a qti-exit-response typed TrackDType is accepted without TrackDType's required
      // src. An xsi:type whose prefix no declaration binds is no QName (Part 2, 3.2.18), which its
      // built-in declaration (Part 1, 3.2.7) refuses wherever the element sits, but the codec
      // refuses it only on an element a declaration assesses (shred's type-unresolved).
      it.effect(
        "xmllint refuses a qti-exit-response an xsi:type retypes to TrackDType without src and a foreign element's xsi:type of an unbound prefix, and accepts a plain qti-exit-response",
        () =>
          Effect.gen(function* retyped() {
            const held = yield* controlled("retyped", {
              "retyped-plain": exitProcessing("<qti-exit-response/>"),
              "retyped-track": exitProcessing(`<qti-exit-response xsi:type="t:TrackDType"/>`),
              "unbound-prefix": markedItem(`<widget xmlns="urn:w" xsi:type="zz:t">x</widget>`),
            });

            assert.deepStrictEqual(
              held.map(({ comparison }) => comparison.xsdClasses),
              [[], ["attribute-required"], ["attribute-value", "other"]],
              "xmllint assesses the retyped element against TrackDType, whose src is required, and refuses the unbound prefix on the xsi:type and, a second time, on its element",
            );
          }),
        { timeout: controlTimeoutMs },
      );

      // The defects three earlier records named, now fixed and so no records: an element in no
      // namespace under an ##other wildcard, which ##other never admits (XML Schema 1.0 Part 1,
      // 3.10.1); a foreign element in xi:include, whose includeType is (fallback | any ##other
      // lax)*; and a simple-content element with no text, whose empty string its type must admit.
      // Both oracles judge each alike, so a regression shows here as well as in a generated run.
      it.effect(
        "both oracles judge alike the three defects the earlier records named",
        () =>
          Effect.gen(function* fixed() {
            const held = yield* controlled("fixed", {
              "empty-schemaversion": `<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" identifier="M"><metadata><schema>QTI Package</schema><schemaversion></schemaversion></metadata><organizations/><resources/></manifest>`,
              "foreign-in-include": `<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" xmlns:xi="http://www.w3.org/2001/XInclude" identifier="T" title="t"><qti-test-part identifier="P" navigation-mode="linear" submission-mode="individual"><qti-assessment-section identifier="S" title="s" visible="true"><xi:include href="s.xml"><widget xmlns="urn:w"/></xi:include></qti-assessment-section></qti-test-part></qti-assessment-test>`,
              "no-namespace-under-other": `<lom xmlns="http://ltsc.ieee.org/xsd/LOM"><general/><widget xmlns="">x</widget></lom>`,
            });

            assert.deepStrictEqual(
              held.map(({ comparison }) => [comparison.verdicts, comparison.differences]),
              [
                ["refused by both", []],
                ["accepted by both", []],
                ["refused by both", []],
              ],
              "an empty schemaversion and a no-namespace element under ##other are refused by both, and a foreign element in xi:include is accepted by both",
            );
          }),
        { timeout: controlTimeoutMs },
      );
    });
  },
);

/**
 * `xmllint`'s message that an element's `xsi:type` resolves to no type definition.
 *
 * @param name - The element's expanded name.
 * @returns The message as the comparison writes it.
 */
const unresolvedMessage = (name: string): string =>
  `line 4 ${name}: The QName value '{urn:x}v' of the xsi:type attribute does not resolve to a type definition.`;

/**
 * An `xsd-only` attribute-value difference.
 *
 * @param detail - What `xmllint` said.
 * @returns The difference.
 */
const xsdOnly = (detail: string): Difference => ({
  class: "attribute-value",
  detail,
  direction: "xsd-only",
  rule: "",
});

describe("xsd.corpus.oracle.test.ts, reading 6's class", () => {
  unit(
    "matches an xsd-only difference whose every message is on an element within a nested root",
    () => {
      const nested = new Set(["{urn:q}item", "{urn:q}config"]);
      const within = `line 4 {urn:q}item: The attribute 'identifier' is required but missing. | line 5 {urn:q}config: This element is not expected.`;

      assert.isTrue(isNestedRoot(xsdOnly(within), nested), "the root and an element within it");
      assert.isFalse(
        isNestedRoot(
          xsdOnly(`${within} | line 2 {urn:q}section: Missing child element(s).`),
          nested,
        ),
        "a difference that also holds a message on an element outside",
      );
      assert.isFalse(
        isNestedRoot(xsdOnly("line 4: Character content is not allowed."), nested),
        "a message on no element",
      );
      assert.isFalse(
        isNestedRoot({ ...xsdOnly(within), direction: "oracle-only" }, nested),
        "a difference the law oracle refuses",
      );
    },
  );
});

describe("xsd.corpus.oracle.test.ts, reading 60's class of a lax xsi:type", () => {
  unit(
    "matches an unresolvable xsi:type on a laxly assessed element, and never a strictly assessed one",
    () => {
      const lax = new Set(["{urn:x}widget"]);

      assert.isTrue(
        isLaxXsiType(xsdOnly(unresolvedMessage("{urn:x}widget")), lax),
        "a foreign element",
      );
      assert.isFalse(
        isLaxXsiType(
          xsdOnly(
            unresolvedMessage("{http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1}schemaversion"),
          ),
          lax,
        ),
        "a declared element, which cvc-elt clause 4.2 refuses",
      );
      assert.isFalse(
        isLaxXsiType(
          xsdOnly(`${unresolvedMessage("{urn:x}widget")} | line 5 {urn:x}widget: another message.`),
          lax,
        ),
        "a difference that also holds another message",
      );
    },
  );
});

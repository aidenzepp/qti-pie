/**
 * The catalog laws on the lease, through the importer, PostgreSQL itself the judge (testing
 * doctrine, rule 3): spec reading R9-a's three laws (information model §5.26.1, §5.27.2 and
 * §5.28.1) over small items built here, a card file the package lacks, and a language a catalog
 * writes that the item's LOM does not list (decision 85).
 *
 * Each refused case is one law broken once, and its accepted twin the nearest package that keeps
 * it: two cards of one support beside two supports, two default entries beside one, a
 * `data-catalog-idref` naming an HTML `id` beside one naming the catalog, and a card file the
 * manifest lists and the package leaves out beside the same file present. The assembly case is
 * reading 117's, which repair-sn-6 and -7 settled: a fragment is judged in the item that includes
 * it, so its reference may name that item's catalog, and one naming no catalog of it is refused.
 * A card entry in `es` under an item whose LOM lists only `en` is accepted, since a catalog sits
 * outside the content body; a body paragraph in `es` is refused under the rule the law oracle
 * gives, "Document lang"'s.
 *
 * A refused case is held to its rule (`ImportRefused.rule`), to the law the database's outcome
 * names, and to the law oracle's verdict on the same package (`oracleVerdict`), whose breaches
 * all keep that one rule. The free side is `#pantry/qti/catalog.oracle.test.ts` and
 * `#pantry/test/catalog-assembly.test.ts`.
 *
 * The phase's fixtures close it: every catalog and companion-materials positive
 * (`catalogNames`, `companionNames`) is imported, exported and compared with its source, every
 * entry equal (`comparePackage`), and every XML-path negative (`catalogNegativeNames`) is refused
 * under a rule its row of `catalogVerdicts` allows.
 */
import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, FileSystem, Layer, Result } from "effect";
import { describe } from "vitest";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import { comparePackage, renderReport } from "#pantry/export/compare.ts";
import { exportPackage } from "#pantry/export/package.ts";
import { importPackage } from "#pantry/import/package.ts";
import { ImportRefused } from "#pantry/import/refusal.ts";
import { readPackage } from "#pantry/package/read.ts";
import { scopedPackage } from "#pantry/test/gen/every-relation.ts";
import type { PackageEntries } from "#pantry/test/gen/every-relation.ts";
import {
  catalogNames,
  catalogNegativeNames,
  catalogVerdicts,
  companionNames,
  materialize,
} from "#pantry/test/fixtures.ts";
import { oracleVerdict } from "#pantry/test/oracle-verdict.ts";
import { asi, item, manifestOf } from "#pantry/test/probe.ts";
import { authorLayerHookTimeoutMs, hasLease, leaseTestTimeoutMs } from "#pantry/test/settings.ts";

/**
 * Replace the one occurrence of a passage in a text.
 *
 * @param text - The text.
 * @param passage - The passage, which must occur exactly once.
 * @param replacement - What replaces it.
 * @returns The edited text.
 */
const replaced = (text: string, passage: string, replacement: string): string => {
  assert.lengthOf(text.split(passage), 2, passage);

  return text.replace(passage, () => replacement);
};

/**
 * The base item of `#pantry/test/probe.ts`, which holds `<p id="intro">`, edited: markup at the end
 * of its body, a catalog info after the body, and optionally an `xml:lang` on its root and an
 * include of `fragment.xml` at the body's end.
 *
 * @param spec - The item.
 * @param spec.body - Markup placed at the end of the body.
 * @param spec.catalogs - The `qti-catalog-info`'s `qti-catalog` children.
 * @param spec.include - Whether the body ends with `<xi:include href="fragment.xml"/>`.
 * @param spec.lang - Whether the root writes `xml:lang="en"`.
 * @returns The item's text.
 */
const itemOf = ({
  body = "",
  catalogs,
  include = false,
  lang = false,
}: {
  readonly body?: string;
  readonly catalogs: string;
  readonly include?: boolean;
  readonly lang?: boolean;
}): string => {
  const withRoot = include
    ? replaced(
        item,
        "<qti-assessment-item ",
        '<qti-assessment-item xmlns:xi="http://www.w3.org/2001/XInclude" ',
      )
    : item;
  const withLang = lang
    ? replaced(withRoot, 'time-dependent="false">', 'time-dependent="false" xml:lang="en">')
    : withRoot;

  return replaced(
    withLang,
    "</qti-item-body>",
    `${body}${include ? '<xi:include href="fragment.xml"/>' : ""}</qti-item-body><qti-catalog-info>${catalogs}</qti-catalog-info>`,
  );
};

/**
 * The item's resource, with its metadata and files beyond `item.xml`.
 *
 * @param spec - The resource.
 * @param spec.files - The `file` and `dependency` elements after `item.xml`'s.
 * @param spec.lom - Whether its LOM lists the one language `en`.
 * @returns The `resource` element.
 */
const itemResourceOf = ({
  files = "",
  lom = false,
}: {
  readonly files?: string;
  readonly lom?: boolean;
}): string =>
  `<resource identifier="R" type="imsqti_item_xmlv3p0" href="item.xml">${lom ? '<metadata><imsmd:lom xmlns:imsmd="http://ltsc.ieee.org/xsd/LOM"><imsmd:general><imsmd:language>en</imsmd:language></imsmd:general></imsmd:lom></metadata>' : ""}<file href="item.xml"/>${files}</resource>`;

/**
 * A catalog `C` of cards, each of the given support, with empty HTML content.
 *
 * @param supports - Each card's `support`, as written.
 * @returns The catalog.
 */
const catalogOf = (...supports: readonly string[]): string =>
  `<qti-catalog id="C">${supports
    .map((support) => `<qti-card support="${support}"><qti-html-content/></qti-card>`)
    .join("")}</qti-catalog>`;

/**
 * A catalog `C` of one card whose entries carry the given `default`s.
 *
 * @param defaults - Each entry's `default`, as written.
 * @returns The catalog.
 */
const entriesOf = (...defaults: readonly string[]): string =>
  `<qti-catalog id="C"><qti-card support="spoken">${defaults
    .map((value) => `<qti-card-entry default="${value}"><qti-html-content/></qti-card-entry>`)
    .join("")}</qti-card></qti-catalog>`;

/**
 * A catalog `C` of one card holding the card file `images/sign.png`.
 */
const fileCatalog = `<qti-catalog id="C"><qti-card support="sign-language"><qti-file-href mime-type="image/png">images/sign.png</qti-file-href></qti-card></qti-catalog>`;

/**
 * A catalog `C` of one card whose one entry writes `xml:lang="es"`.
 */
const spanishCatalog = `<qti-catalog id="C"><qti-card support="keyword-translation"><qti-card-entry xml:lang="es"><qti-html-content>preciso</qti-html-content></qti-card-entry></qti-card></qti-catalog>`;

/**
 * The card file's bytes: a PNG signature, which no law reads.
 */
const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/**
 * A package's entries from its files' texts, each encoded as UTF-8.
 *
 * @param files - Each path's text.
 * @returns The entries.
 */
const entriesFrom = (files: Readonly<Record<string, string>>): PackageEntries =>
  new Map(Object.entries(files).map(([file, text]) => [file, new TextEncoder().encode(text)]));

/**
 * A package of the one item, its resource as given.
 *
 * @param itemText - The item's text.
 * @param resource - The item's resource.
 * @returns The entries.
 */
const itemPackage = (itemText: string, resource = itemResourceOf({})): PackageEntries =>
  entriesFrom({ "imsmanifest.xml": manifestOf(resource), "item.xml": itemText });

/**
 * A package of the item that includes `fragment.xml`, whose one paragraph writes the given
 * `data-catalog-idref`, and holds catalog `C`.
 *
 * @param token - The fragment's `data-catalog-idref`.
 * @returns The entries.
 */
const fragmentPackage = (token: string): PackageEntries =>
  entriesFrom({
    "fragment.xml": `<div xmlns="${asi}"><p data-catalog-idref="${token}">x</p></div>`,
    "imsmanifest.xml": manifestOf(
      `${itemResourceOf({ files: '<dependency identifierref="F"/>' })}<resource identifier="F" type="imsqti_fragment_xmlv3p0" href="fragment.xml"><file href="fragment.xml"/></resource>`,
    ),
    "item.xml": itemOf({ catalogs: catalogOf("spoken"), include: true }),
  });

/**
 * A package whose item lists only `en` in its LOM and writes `xml:lang="en"` on its root, with a
 * catalog card entry in `es` and the given body markup.
 *
 * @param body - Markup at the end of the body.
 * @returns The entries.
 */
const englishPackage = (body: string): PackageEntries =>
  itemPackage(
    itemOf({ body, catalogs: spanishCatalog, lang: true }),
    itemResourceOf({ lom: true }),
  );

/**
 * A package that lists the card file, with or without its bytes.
 *
 * @param present - Whether the package holds `images/sign.png`.
 * @returns The entries.
 */
const filePackage = (present: boolean): PackageEntries => {
  const listed = entriesFrom({
    "imsmanifest.xml": manifestOf(itemResourceOf({ files: '<file href="images/sign.png"/>' })),
    "item.xml": itemOf({ catalogs: fileCatalog }),
  });

  return present ? new Map([...listed, ["images/sign.png", png]]) : listed;
};

/**
 * A refused case: its package, its rule, and the laws the database may name it under, each a law
 * of that rule the oracle finds broken.
 */
interface Refusal {
  readonly files: PackageEntries;
  readonly laws: readonly string[];
  readonly name: string;
  readonly rule: string;
}

/**
 * The refused cases, each one law's.
 */
const refusals: readonly Refusal[] = [
  {
    files: itemPackage(itemOf({ catalogs: catalogOf("spoken", "spoken") })),
    laws: ["Card support"],
    name: "two cards of one support in one catalog",
    rule: "card-support",
  },
  {
    files: itemPackage(itemOf({ catalogs: entriesOf("true", "1") })),
    laws: ["Card default entry"],
    name: "two default entries in one card, true and 1",
    rule: "card-default",
  },
  {
    files: itemPackage(
      itemOf({ body: '<p data-catalog-idref="intro">b</p>', catalogs: catalogOf("spoken") }),
    ),
    laws: ["Catalog reference"],
    name: "a data-catalog-idref naming an HTML id",
    rule: "idref-target",
  },
  {
    files: filePackage(false),
    laws: ["File exists"],
    name: "a card file the manifest lists and the package lacks",
    rule: "file-exists",
  },
  {
    files: fragmentPackage("Z"),
    laws: ["Catalog reference", "Idref target"],
    name: "a fragment's data-catalog-idref naming no catalog of the item that includes it",
    rule: "idref-target",
  },
  {
    files: englishPackage('<p xml:lang="es">Hola</p>'),
    laws: ["Document lang"],
    name: "a body paragraph in es under an en-only LOM",
    rule: "document-lang",
  },
];

/**
 * The accepted cases: each refused case's twin, and the card entry in `es` under an `en`-only LOM.
 */
const acceptances: readonly { readonly files: PackageEntries; readonly name: string }[] = [
  {
    files: itemPackage(itemOf({ catalogs: catalogOf("spoken", "braille") })),
    name: "two cards of two supports",
  },
  {
    files: itemPackage(itemOf({ catalogs: entriesOf("true", "false") })),
    name: "one default entry beside one that is not",
  },
  {
    files: itemPackage(
      itemOf({ body: '<p data-catalog-idref="C">b</p>', catalogs: catalogOf("spoken") }),
    ),
    name: "a data-catalog-idref naming the catalog",
  },
  { files: filePackage(true), name: "a card file the manifest lists and the package holds" },
  {
    files: fragmentPackage("C"),
    name: "a fragment's data-catalog-idref naming a catalog of the item that includes it",
  },
  {
    files: englishPackage(""),
    name: "a card entry in es under an en-only LOM",
  },
];

/**
 * The directory every export here is made under: the package's gitignored `work/`.
 */
const workDirectory = path.resolve(import.meta.dirname, "../../work");

/**
 * The rules a phase-9 negative may be refused under, its row of `catalogVerdicts`.
 *
 * @param name - The negative.
 * @returns The row's rules.
 */
const verdictOf = (name: (typeof catalogNegativeNames)[number]): readonly string[] =>
  catalogVerdicts.find(([negative]) => negative === name)?.[1] ??
  assert.fail(`${name} has no row in catalogVerdicts`);

describe.skipIf(!hasLease)(
  "qti/catalog.db.test.ts, on the lease",
  { timeout: leaseTestTimeoutMs },
  () => {
    layer(Layer.mergeAll(AuthorAppLayer, NodeServices.layer), {
      excludeTestServices: true,
      timeout: authorLayerHookTimeoutMs,
    })("the catalog laws, judged by PostgreSQL through the importer", (it) => {
      for (const { files, laws, name, rule } of refusals) {
        it.effect(`refuses ${name} under ${rule}, as the law oracle predicts`, () =>
          // Oracle: the specification as a checker (spec reading R9-a; reading 117 for the
          // fragment; QTI 3.0 Metadata §2.7.1.3 and decision 85 for the body language), the rule the
          // free fixture table gives the same law (`catalogVerdicts`), and the law oracle's verdict
          // on the same package.
          Effect.scoped(
            Effect.gen(function* refusedCatalog() {
              const dir = yield* scopedPackage(files);
              const expected = yield* oracleVerdict(yield* readPackage(dir));
              const refused = yield* Effect.flip(importPackage(dir));

              assert.deepStrictEqual(
                expected.kind === "refused" ? [...expected.rules] : [],
                [rule],
                `${name}: the oracle's rules`,
              );
              assert.isTrue(refused instanceof ImportRefused, `${name}: ${refused._tag}`);

              if (refused instanceof ImportRefused) {
                assert.strictEqual(refused.rules[0], rule, `${name}: ${refused.detail}`);
                assert.strictEqual(refused.origin._tag, "Database", name);
                assert.isTrue(
                  refused.origin._tag === "Database" &&
                    refused.origin.laws.some(
                      (law) => law.name !== undefined && laws.includes(law.name),
                    ),
                  `${name}: the database's laws name one of ${laws.join(", ")}`,
                );
              }
            }),
          ),
        );
      }

      for (const { files, name } of acceptances) {
        it.effect(`accepts ${name}, as the law oracle predicts`, () =>
          // Oracle: the specification as a checker (spec reading R9-a; reading 117; decision 85: a
          // catalog sits outside the content body, so its languages are no language of the item),
          // and the law oracle's verdict on the same package.
          Effect.scoped(
            Effect.gen(function* acceptedCatalog() {
              const dir = yield* scopedPackage(files);
              const expected = yield* oracleVerdict(yield* readPackage(dir));
              const imported = yield* Effect.result(importPackage(dir));

              assert.strictEqual(expected.kind, "accepted", `${name}: the oracle's verdict`);
              assert.isTrue(
                Result.isSuccess(imported),
                `${name}: ${Result.isFailure(imported) ? imported.failure.message : "accepted"}`,
              );
            }),
          ),
        );
      }
    });

    layer(Layer.mergeAll(AuthorAppLayer, NodeServices.layer), {
      excludeTestServices: true,
      timeout: authorLayerHookTimeoutMs,
    })("the phase-9 fixtures, round-tripped and refused through the importer", (it) => {
      for (const name of [...catalogNames, ...companionNames]) {
        it.effect(`${name}: imports, exports and compares equal with its source`, () =>
          // Oracle: the source package as `readPackage` lists it, and `comparePackage` of it with
          // the files the export wrote, which reads no database.
          Effect.scoped(
            Effect.gen(function* roundTripped() {
              const fs = yield* FileSystem.FileSystem;
              const dir = yield* materialize(name);
              const id = yield* importPackage(dir);

              yield* fs.makeDirectory(workDirectory, { recursive: true });

              const target = yield* fs.makeTempDirectoryScoped({
                directory: workDirectory,
                prefix: "catalog-db-test-",
              });

              yield* exportPackage(id, target);

              const report = yield* comparePackage(dir, target);

              assert.isFalse(
                report.some(({ outcome }) => outcome.kind === "differs"),
                `${name}:\n${renderReport(report)}`,
              );
            }),
          ),
        );
      }

      for (const name of catalogNegativeNames) {
        const rules = verdictOf(name);

        it.effect(`${name}: refuses it under one of ${rules.join(", ")}`, () =>
          // Oracle: the predicted column of the spec's 4.9 table, the rules `catalogVerdicts` gives
          // the negative, which the free fixture tests hold the law oracle to.
          Effect.gen(function* refusedNegative() {
            const refused = yield* Effect.flip(importPackage(yield* materialize(name)));

            assert.isTrue(refused instanceof ImportRefused, `${name}: ${refused._tag}`);

            if (refused instanceof ImportRefused) {
              assert.include(rules, refused.rules[0], `${name}: ${refused.detail}`);
            }
          }),
        );
      }
    });
  },
);

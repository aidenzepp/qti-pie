/**
 * The manifest is one document, read once: the package's one `imsmanifest.xml`, the description of
 * the package and no resource's document (spec reading 146). A path is one document, of one type
 * (reading 93), and the manifest's is fixed, `none`, since it is read before any resource names a
 * path. So a document-typed resource whose href names `imsmanifest.xml` names no document of its
 * type, and "Document entry" (`entry-kind`) refuses it, on the import's rows as in the law oracle;
 * a `cp:file` naming it only locates it (IMS Content Packaging 1.2, §6.11.3); and a site whose href
 * names it names no document, whatever names it. The import's reader and the oracle shredded the
 * manifest a second time, as the document of each resource whose href named it, so the package
 * held two documents at one path, the copy writing the manifest overlays again, and a site could
 * target the copy (FIX-HOLES).
 *
 * Oracle: a second implementation, the law oracle (`#pantry/test/oracle.ts` `judge`), against the
 * laws the import's rows break on the host (`#pantry/test/gen/genetic/judge.ts` `judgeOne`), and
 * the specification as a checker for the documents each side reads: one per path, the manifest's
 * of no type, no site's target. "Document entry" over a document-typed href is a rule over a query
 * (`TypedHref`, `#pantry/qti/queries.ts`), which the host judge leaves to the database, so the
 * oracle's side alone is held to it here.
 *
 * Bound: a manifest with 0 to 2 item resources, each listing as files a subset of
 * {`imsmanifest.xml`, `item.xml`} and naming one of them by its href or none (8 resources), and
 * `item.xml` with and without an include of the manifest in its body: (1 + 8 + 64) × 2 = 146
 * packages, exhausted.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { noCoverage } from "@grizzle/testing/features";
import { int } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, Option } from "effect";
import { grammar } from "#pantry/grammar/install.ts";
import { readProgram } from "#pantry/import/program.ts";
import { manifestPath } from "#pantry/qti/package.ts";
import { scopedPackage } from "#pantry/test/gen/every-relation.ts";
import type { PackageEntries } from "#pantry/test/gen/every-relation.ts";
import { genomeOf } from "#pantry/test/gen/genetic/genome.ts";
import { judgeOne, shownDisagreement } from "#pantry/test/gen/genetic/judge.ts";
import { filesOf } from "#pantry/test/oracle-complete/mutation.ts";
import { judge, lawsOf } from "#pantry/test/oracle.ts";
import { scratchDirectory } from "#pantry/test/scratch.ts";

/**
 * The oracle's law tables over the composed grammar.
 */
const laws = lawsOf(grammar);

/**
 * The item's path.
 */
const itemPath = "item.xml";

/**
 * One resource of the box: the paths its files list, in order, and the one its href names, none
 * for a resource with no href.
 */
interface BoxResource {
  readonly files: readonly string[];
  readonly href: Option.Option<string>;
}

/**
 * Every resource of the box: each subset of the two paths as its files, with each of them, or
 * none, as its href.
 */
const boxResources: readonly BoxResource[] = [
  [],
  [manifestPath],
  [itemPath],
  [manifestPath, itemPath],
].flatMap((files) => [
  { files, href: Option.none() },
  ...files.map((path) => ({ files, href: Option.some(path) })),
]);

/**
 * One package of the box: its resources, and whether the item includes the manifest.
 */
interface Case {
  readonly includes: boolean;
  readonly resources: readonly BoxResource[];
}

/**
 * Every package of the box.
 */
const cases: readonly Case[] = [
  [],
  ...boxResources.map((resource) => [resource]),
  ...boxResources.flatMap((first) => boxResources.map((second) => [first, second])),
].flatMap((resources) => [false, true].map((includes) => ({ includes, resources })));

/**
 * Write a resource of the box.
 *
 * @param resource - The resource.
 * @param at - Its number, which its identifier spells.
 * @returns Its element's text.
 */
const resourceText = ({ files, href }: BoxResource, at: number): string =>
  `<resource identifier="r${String(at)}" type="imsqti_item_xmlv3p0"${Option.match(href, {
    onNone: () => "",
    onSome: (path) => ` href="${path}"`,
  })}>${files.map((path) => `<file href="${path}"/>`).join("")}</resource>`;

/**
 * Write a package of the box: its manifest and its item.
 *
 * @param of - The case.
 * @returns Its entries.
 */
const packageOf = (of: Case): PackageEntries => {
  const text = new TextEncoder();

  return new Map([
    [
      manifestPath,
      text.encode(
        `<?xml version="1.0" encoding="UTF-8"?><manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" identifier="m"><metadata><schema>QTI Package</schema><schemaversion>3.0.0</schemaversion></metadata><organizations/><resources>${of.resources.map(resourceText).join("")}</resources></manifest>`,
      ),
    ],
    [
      itemPath,
      text.encode(
        `<?xml version="1.0" encoding="UTF-8"?><qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" xmlns:xi="http://www.w3.org/2001/XInclude" identifier="item" title="Item" adaptive="false" time-dependent="false"><qti-item-body><p>Item</p>${of.includes ? `<xi:include href="${manifestPath}"/>` : ""}</qti-item-body></qti-assessment-item>`,
      ),
    ],
  ]);
};

/**
 * Name a case.
 *
 * @param of - The case.
 * @returns Its resources, each as its files and its href, and the include.
 */
const literalOf = (of: Case): string =>
  `[${of.resources
    .map(
      ({ files, href }) =>
        `files {${files.join(", ")}} href ${Option.getOrElse(href, () => "none")}`,
    )
    .join("; ")}]${of.includes ? " with an include of the manifest" : ""}`;

/**
 * Whether no two of the paths are one.
 *
 * @param paths - The paths.
 * @returns Whether they are distinct.
 */
const distinct = (paths: readonly string[]): boolean => new Set(paths).size === paths.length;

layer(NodeServices.layer, { excludeTestServices: true })("the manifest", (it) => {
  it.effect(
    "is one document, of no type, read once and no site's target, and a document-typed href naming it is Document entry in the law oracle",
    (ctx) =>
      searched(
        ctx,
        Effect.gen(function* manifestDocumentRuns() {
          const directory = yield* scratchDirectory("manifest-document-");
          const bench = { directory, grammar, laws };

          assert.strictEqual(boxResources.length, 8);
          assert.strictEqual(cases.length, 146);

          return yield* exhaust(
            {
              box: "a manifest with 0 to 2 item resources, each listing a subset of {imsmanifest.xml, item.xml} and naming one or none by its href, and an item with and without an include of the manifest",
              caseHang: Duration.minutes(5),
              coverage: noCoverage,
              generator: int(0, cases.length - 1),
              limit: cases.length,
              literal: (at) => {
                const of = cases[at];

                return of === undefined ? String(at) : literalOf(of);
              },
              oracle: {
                kind: "second-implementation",
                name: "the law oracle against the laws the import's rows break on the host, and the documents each side reads",
              },
              suite: "pantry/manifest-document",
            },
            (at) =>
              Effect.gen(function* manifestDocumentCase() {
                const of = cases[at];
                assert.isDefined(of, `no case ${String(at)}`);
                if (of === undefined) {
                  return;
                }

                const entries = packageOf(of);
                const judged = yield* judgeOne(yield* genomeOf(entries), bench, at);
                const said = `${literalOf(of)}: the oracle ${judged.summary.oracle}; the import ${judged.summary.import}`;

                assert.deepStrictEqual(judged.disagreements.map(shownDisagreement), [], said);

                const oracle = yield* judge(filesOf(entries), grammar, laws);
                assert.strictEqual(oracle._tag, "Judged", said);
                if (oracle._tag === "Judged") {
                  assert.isTrue(
                    distinct(oracle.documents),
                    `${said}: the oracle reads ${oracle.documents.join(", ")}`,
                  );
                }

                const read = yield* readProgram(yield* scopedPackage(entries));
                const paths = read.documents.map(({ listed }) => listed.path);
                assert.isTrue(distinct(paths), `${said}: the import reads ${paths.join(", ")}`);
                assert.deepStrictEqual(
                  read.documents
                    .filter(({ listed }) => listed.path === manifestPath)
                    .map(({ listed }) => listed.documentType),
                  ["manifest"],
                  said,
                );
                for (const { ids, listed } of read.documents) {
                  assert.isTrue(
                    Option.isNone(ids.targetAt(manifestPath)),
                    `${said}: a site in ${listed.path} may target the manifest`,
                  );
                }

                if (of.resources.some(({ href }) => Option.contains(href, manifestPath))) {
                  assert.match(judged.summary.oracle, /\bDocument entry\b/u, said);
                }
              }).pipe(Effect.scoped),
          );
        }).pipe(Effect.scoped),
      ),
    600_000,
  );
});

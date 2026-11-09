/**
 * A document-typed resource's href names the one document at its path, of its type, and that
 * document is an entry: "Document entry" (`entry-kind`), as spec reading 93 and the readings' href
 * resolution state ("refused where a law needs it to name an entry (a document-typed resource's
 * href, "Document entry")"), on the import's rows as in the law oracle. The containment that holds
 * a document-typed href to a document of its type (`#pantry/qti/package.ts`, `documentHrefs` in
 * `Document`) is that law's, never `RootOfType`'s, whose breach is a document whose (type, root
 * kind) no row of `RootOfType` pairs. GEN-A's differential found the import naming a listed
 * resource with no entry `RootOfType`, a law the oracle does not raise there.
 *
 * Oracle: a second implementation, the law oracle (`#pantry/test/oracle.ts` `judge`), against the
 * laws the import's rows break on the host (`#pantry/test/gen/genetic/judge.ts` `judgeOne`).
 * "Document entry" over a document-typed href is a rule over a query (`TypedHref`,
 * `#pantry/qti/queries.ts`), which the host judge leaves to the database, so the oracle's side
 * alone is held to it here, and `#pantry/qti/package.db.test.ts` holds the database to it; neither
 * side raises `RootOfType`.
 *
 * Bound: the every-relation package with one resource added whose href, and its one file, names
 * no entry: for each of the 10 resource types `RootOfType` maps, at a path in the package with no
 * entry (10 cases), and for the item type, each other way an href names none: a path in a
 * directory, one through a dot-dot segment, and the two external forms, a scheme and a leading `/`
 * (4 cases); and the fragment item2.xml includes listed under a second type, the outcome
 * declaration's, beside its own (1 case): 15 cases, exhausted. The import reads that path once, as
 * the fragment its first resource names, so it is judged where item2.xml splices it and nowhere
 * alone, and the second type's href names no document of its type, "Document entry" alone: neither
 * side raises RootOfType for it, and the import's rows break no Idref target the oracle does not.
 *
 * A section ref names a section document only through the href it writes: one that writes none is
 * AL3's alone, never "Document entry"'s (spec reading 115, "one cause per fault"). Bound: a section
 * document whose one section ref writes no href, then the controls, one whose href names a listed
 * item and one whose href names its own document (`#s`, a same-document reference): 3 cases,
 * exhausted. The first breaks AL3 on both sides and "Document entry" on neither; each control
 * breaks "Document entry" on both, as its href is demanded a path and names no section document.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { noCoverage } from "@grizzle/testing/features";
import { int } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect } from "effect";
import { grammar } from "#pantry/grammar/install.ts";
import { everyRelationPackage } from "#pantry/test/gen/every-relation.ts";
import type { PackageEntries } from "#pantry/test/gen/every-relation.ts";
import { genomeOf } from "#pantry/test/gen/genetic/genome.ts";
import { judgeOne, shownDisagreement } from "#pantry/test/gen/genetic/judge.ts";
import { lawsOf } from "#pantry/test/oracle.ts";
import { scratchDirectory } from "#pantry/test/scratch.ts";

/**
 * The timeout, in milliseconds, that this file's slower tests state, each itself or through its
 * describe: a hang guard, never a budget. Measured 2026-11-07: 66 s at a load average of 68 to 108,
 * its slowest test.
 */
const testTimeoutMs = 600_000;

/**
 * The oracle's law tables over the composed grammar.
 */
const laws = lawsOf(grammar);

/**
 * The every-relation package the cases add a resource to, at its smallest member counts.
 */
const base = everyRelationPackage({ choices: 2, hotspots: 1, hottexts: 1 });

/**
 * Each resource type `RootOfType` maps, once, in the grammar's order.
 */
const documentTypes = [...new Set(grammar.package.rootOfType.rows.map(({ type }) => type))];

/**
 * One case: the type of the resource added, and the href it and its one file write.
 */
interface Case {
  readonly href: string;
  readonly type: string;
}

/**
 * The every-relation package's fragment, which item2.xml includes, listed again under the outcome
 * declaration's type.
 */
const twin: Case = { href: "items/fragment.xml", type: "imsqti_outcomes_xmlv3p0" };

/**
 * Every case of the bound: each type naming a path with no entry, then the item type naming none
 * each other way, then the fragment listed under a second type.
 */
const cases: readonly Case[] = [
  ...documentTypes.map((type): Case => ({ href: "missing.xml", type })),
  ...[
    "items/missing.xml",
    "items/../missing.xml",
    "https://example.com/missing.xml",
    "/missing.xml",
  ].map((href): Case => ({ href, type: "imsqti_item_xmlv3p0" })),
  twin,
];

/**
 * Add a resource of the case's type to the base's manifest, its href and its one file the case's
 * href.
 *
 * @param of - The case.
 * @returns The package.
 */
const packageOf = (of: Case): PackageEntries => {
  const manifest = new TextDecoder().decode(base.get("imsmanifest.xml"));
  const entries = new Map(base);
  entries.set(
    "imsmanifest.xml",
    new TextEncoder().encode(
      manifest.replace(
        "  </resources>",
        `    <resource identifier="added-res" type="${of.type}" href="${of.href}">\n      <file href="${of.href}"/>\n    </resource>\n  </resources>`,
      ),
    ),
  );

  return entries;
};

/**
 * The text every XML file of the section ref cases opens with.
 */
const declaration = '<?xml version="1.0" encoding="UTF-8"?>';

/**
 * A manifest that lists each resource, by its type and href, with no identifier or file.
 *
 * @param resources - Each resource's type and href.
 * @returns The manifest's bytes.
 */
const manifestOf = (resources: readonly Case[]): Uint8Array =>
  new TextEncoder().encode(
    `${declaration}<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources>${resources.map(({ href, type }) => `<resource type="${type}" href="${href}"/>`).join("")}</resources></manifest>`,
  );

/**
 * A section document, d1.xml, whose one section ref writes the attributes given.
 *
 * @param attributes - The section ref's attributes as written, empty for none.
 * @returns The document's bytes.
 */
const sectionOf = (attributes: string): Uint8Array =>
  new TextEncoder().encode(
    `${declaration}<qti-assessment-section xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-assessment-section-ref${attributes}/></qti-assessment-section>`,
  );

/**
 * The section d1.xml, listed under the section type.
 */
const sectionResource: Case = { href: "d1.xml", type: "imsqti_section_xmlv3p0" };

/**
 * One section ref case: what it is, the package, and whether its section ref writes an href that
 * stays in the package, so that "Document entry" demands it a path.
 */
interface SectionRefCase {
  readonly demanded: boolean;
  readonly entries: PackageEntries;
  readonly name: string;
}

/**
 * Every section ref case of the bound: the ref with no href (gr2-close's reduced package A1), then
 * the two controls.
 */
const sectionRefCases: readonly SectionRefCase[] = [
  {
    demanded: false,
    entries: new Map([
      ["d1.xml", sectionOf("")],
      ["imsmanifest.xml", manifestOf([sectionResource])],
    ]),
    name: "a section ref with no href",
  },
  {
    demanded: true,
    entries: new Map([
      ["d1.xml", sectionOf(' href="i.xml"')],
      [
        "i.xml",
        new TextEncoder().encode(
          `${declaration}<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"/>`,
        ),
      ],
      [
        "imsmanifest.xml",
        manifestOf([sectionResource, { href: "i.xml", type: "imsqti_item_xmlv3p0" }]),
      ],
    ]),
    name: "a section ref whose href names a listed item",
  },
  {
    demanded: true,
    entries: new Map([
      ["d1.xml", sectionOf(' href="#s"')],
      ["imsmanifest.xml", manifestOf([sectionResource])],
    ]),
    name: "a section ref whose href names its own document",
  },
];

layer(NodeServices.layer, { excludeTestServices: true })(
  "a document-typed href that names no entry",
  (it) => {
    it.effect(
      "is Document entry in the law oracle, and RootOfType on neither side",
      (ctx) =>
        searched(
          ctx,
          Effect.gen(function* documentEntryRuns() {
            const directory = yield* scratchDirectory("document-entry-");
            const bench = { directory, grammar, laws };

            assert.strictEqual(documentTypes.length, 10, "the resource types RootOfType maps");
            assert.strictEqual(cases.length, 15);

            return yield* exhaust(
              {
                box: "the 10 document types, each naming a path with no entry, the item type naming none four other ways, and an included fragment listed under a second type",
                caseHang: Duration.minutes(5),
                coverage: noCoverage,
                generator: int(0, cases.length - 1),
                limit: cases.length,
                literal: (at) => {
                  const of = cases[at];

                  return of === undefined ? String(at) : `${of.type} at ${of.href}`;
                },
                oracle: {
                  kind: "second-implementation",
                  name: "the law oracle against the laws the import's rows break on the host",
                },
                suite: "pantry/document-entry",
              },
              (at) =>
                Effect.gen(function* documentEntryCase() {
                  const of = cases[at];
                  assert.isDefined(of, `no case ${String(at)}`);
                  if (of === undefined) {
                    return;
                  }

                  const judged = yield* judgeOne(yield* genomeOf(packageOf(of)), bench, at);
                  const said = `${of.type} at ${of.href}: the oracle ${judged.summary.oracle}; the import ${judged.summary.import}`;
                  const watched: readonly string[] =
                    of === twin
                      ? ["Document entry", "RootOfType", "Idref target"]
                      : ["Document entry", "RootOfType"];
                  const apart = judged.disagreements.filter(
                    (disagreement) =>
                      (disagreement.kind === "oracle-only-law" ||
                        disagreement.kind === "import-only-law") &&
                      watched.includes(disagreement.law),
                  );

                  assert.deepStrictEqual(apart.map(shownDisagreement), [], said);
                  assert.match(judged.summary.oracle, /\bDocument entry\b/u, said);
                  assert.notMatch(judged.summary.oracle, /\bRootOfType\b/u, said);
                  assert.notMatch(judged.summary.import, /\bRootOfType\b/u, said);
                }),
            );
          }).pipe(Effect.scoped),
        ),
      testTimeoutMs,
    );

    it.effect(
      "is Document entry for a section ref only where it writes an href that stays in the package, on the import's rows as in the law oracle",
      (ctx) =>
        searched(
          ctx,
          Effect.gen(function* sectionRefRuns() {
            const directory = yield* scratchDirectory("document-entry-section-ref-");
            const bench = { directory, grammar, laws };

            assert.strictEqual(sectionRefCases.length, 3);

            return yield* exhaust(
              {
                box: "the 3 section ref cases: one with no href, one whose href names a listed item, and one whose href names its own document",
                caseHang: Duration.minutes(5),
                coverage: noCoverage,
                generator: int(0, sectionRefCases.length - 1),
                limit: sectionRefCases.length,
                literal: (at) => sectionRefCases[at]?.name ?? String(at),
                oracle: {
                  kind: "second-implementation",
                  name: "the law oracle against the laws the import's rows break on the host",
                },
                suite: "pantry/document-entry",
              },
              (at) =>
                Effect.gen(function* sectionRefCase() {
                  const of = sectionRefCases[at];
                  assert.isDefined(of, `no case ${String(at)}`);
                  if (of === undefined) {
                    return;
                  }

                  const judged = yield* judgeOne(yield* genomeOf(of.entries), bench, at);
                  const said = `${of.name}: the oracle ${judged.summary.oracle}; the import ${judged.summary.import}`;
                  const apart = judged.disagreements.filter(
                    (disagreement) =>
                      (disagreement.kind === "oracle-only-law" ||
                        disagreement.kind === "import-only-law") &&
                      disagreement.law === "Document entry",
                  );

                  assert.deepStrictEqual(apart.map(shownDisagreement), [], said);
                  if (of.demanded) {
                    assert.match(judged.summary.oracle, /\bDocument entry\b/u, said);
                    assert.match(judged.summary.import, /\bDocument entry\b/u, said);
                  } else {
                    assert.notMatch(judged.summary.oracle, /\bDocument entry\b/u, said);
                    assert.notMatch(judged.summary.import, /\bDocument entry\b/u, said);
                    assert.match(judged.summary.oracle, /\bAL3 required\b/u, said);
                  }
                }),
            );
          }).pipe(Effect.scoped),
        ),
      testTimeoutMs,
    );
  },
);

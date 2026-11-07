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
 *
 * Bound: the every-relation package with one resource added whose href, and its one file, names
 * no entry: for each of the 10 resource types `RootOfType` maps, at a path in the package with no
 * entry (10 cases), and for the item type, each other way an href names none: a path in a
 * directory, one through a dot-dot segment, and the two external forms, a scheme and a leading `/`
 * (4 cases), 14 cases, exhausted. A path listed under two document types is "Document entry" by
 * `Document`'s key over (package, path), which the host does not evaluate, so the bound leaves it
 * out.
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
 * Every case of the bound: each type naming a path with no entry, then the item type naming none
 * each other way.
 */
const cases: readonly Case[] = [
  ...documentTypes.map((type): Case => ({ href: "missing.xml", type })),
  ...[
    "items/missing.xml",
    "items/../missing.xml",
    "https://example.com/missing.xml",
    "/missing.xml",
  ].map((href): Case => ({ href, type: "imsqti_item_xmlv3p0" })),
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

layer(NodeServices.layer, { excludeTestServices: true })(
  "a document-typed href that names no entry",
  (it) => {
    it.effect(
      "is Document entry on the import's rows as in the law oracle, and never RootOfType",
      (ctx) =>
        searched(
          ctx,
          Effect.gen(function* documentEntryRuns() {
            const directory = yield* scratchDirectory("document-entry-");
            const bench = { directory, grammar, laws };

            assert.strictEqual(documentTypes.length, 10, "the resource types RootOfType maps");
            assert.strictEqual(cases.length, 14);

            return yield* exhaust(
              {
                box: "the 10 document types, each naming a path with no entry, and the item type naming none four other ways",
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
                  const apart = judged.disagreements.filter(
                    (disagreement) =>
                      (disagreement.kind === "oracle-only-law" ||
                        disagreement.kind === "import-only-law") &&
                      (disagreement.law === "Document entry" || disagreement.law === "RootOfType"),
                  );

                  assert.deepStrictEqual(apart.map(shownDisagreement), [], said);
                  assert.match(judged.summary.oracle, /\bDocument entry\b/u, said);
                  assert.match(judged.summary.import, /\bDocument entry\b/u, said);
                  assert.notMatch(judged.summary.oracle, /\bRootOfType\b/u, said);
                  assert.notMatch(judged.summary.import, /\bRootOfType\b/u, said);
                }),
            );
          }).pipe(Effect.scoped),
        ),
      600_000,
    );
  },
);

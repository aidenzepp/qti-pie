/**
 * The two laws the export trusts, held by the database alone, on the lease: "Document entry", each
 * document's path an entry's (`Document` ⊆ `Entry` over package and path,
 * `#pantry/qti/package.ts`), and `XmlDecl.version`'s pattern law, a `VersionNum` (`XmlVersion` of
 * `#pantry/qti/chardata.ts`, "XML production"). The export checks neither again
 * (`#pantry/export/package.ts` `exportEntries`, `#pantry/export/pages.ts` `assembleScan`): serving
 * trusts the stored rows, which the database judged once, when the import wrote them.
 *
 * Each case writes the every-relation package, which PostgreSQL accepts whole
 * (`#pantry/import/pattern-laws.db.test.ts`), with one fault planted in its inputs past the reader,
 * which refuses neither fault in a package's bytes, and shows that the database refuses the write
 * under the law.
 */
import { sameLaw } from "@bjornpagen/grizzle";
import type { Law } from "@bjornpagen/grizzle";
import { Db } from "@bjornpagen/grizzle/runtime";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Array as Arr, Effect, Formatter, Layer, Option } from "effect";
import { describe } from "vitest";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import { AuthorLogin } from "#pantry/db/served.ts";
import { readProgram } from "#pantry/import/program.ts";
import type { LawName } from "#pantry/import/refusal.ts";
import { packageFactsOf } from "#pantry/import/write.ts";
import type { PackageInputs } from "#pantry/import/write.ts";
import { Qti } from "#pantry/qti/own.ts";
import { everyRelationPackage, scopedPackage } from "#pantry/test/gen/every-relation.ts";
import { schemaLawNameOf, schemaLawsOf } from "#pantry/test/law-namer.ts";
import { hasLease, leaseTestTimeoutMs } from "#pantry/test/settings.ts";

/**
 * The manifest's path, a document every package holds, which no `cp:file`, site or reference names,
 * so its entry is read by "Document entry" alone.
 */
const manifestPath = "imsmanifest.xml";

/**
 * Each case: the fault, the edit that plants it in the package's inputs, the law the database
 * refuses it under, and that law's name in the law table.
 */
const cases: readonly {
  readonly edit: (inputs: PackageInputs) => PackageInputs;
  readonly fault: string;
  readonly isLaw: (law: Law) => boolean;
  readonly name: LawName;
}[] = [
  {
    edit: (inputs) => ({
      ...inputs,
      Package: new Map(
        [...inputs.Package].map(([id, record]) => [
          id,
          { ...record, entries: record.entries.filter(({ path }) => path !== manifestPath) },
        ]),
      ),
    }),
    fault: "the manifest's document at a path the package records no entry at",
    isLaw: (law) =>
      law.kind === "contained" && law.from.relation === "Document" && law.to.relation === "Entry",
    name: "Document entry",
  },
  {
    edit: (inputs) => ({
      ...inputs,
      XmlDecl: new Map(
        [...inputs.XmlDecl].map(([node, row]) => [node, { ...row, version: "1.1e2" as const }]),
      ),
    }),
    // `1.1e2` is of the field's TypeScript type, `1.${number}`, and no VersionNum, which is `1.`
    // and digits alone, so only the database refuses it.
    fault: "every XML declaration's version 1.1e2, which is no VersionNum",
    isLaw: (law) => law.kind === "pattern" && law.relation === "XmlDecl" && law.field === "version",
    name: "XML production",
  },
];

describe.skipIf(!hasLease)("export/trusted-laws.db.test.ts, on the lease", () => {
  layer(Layer.mergeAll(AuthorAppLayer, NodeServices.layer), {
    excludeTestServices: true,
  })("the laws the export trusts, judged by PostgreSQL", (it) => {
    for (const { edit, fault, isLaw, name } of cases) {
      it.effect(
        `refuses ${fault} under ${name}`,
        () =>
          // Oracle: PostgreSQL, the constraint or domain that holds the law as the import's one
          // statement per relation writes the rows, and grizzle's outcome, which names the law
          // among those it refused (`lawsOf`), named by the law table as `name`. Bound: the
          // every-relation package, which PostgreSQL accepts whole, with the one fault planted.
          Effect.gen(function* trustedLaw() {
            const law = Arr.findFirst(schemaLawsOf(Qti), isLaw).pipe(
              Option.getOrThrowWith(() => new Error(`Qti states no law of ${name} for ${fault}`)),
            );
            const dir = yield* scopedPackage(
              everyRelationPackage({ choices: 2, hotspots: 1, hottexts: 1 }),
            );
            const program = yield* readProgram(dir);
            const db = yield* Db.open((yield* AuthorLogin).roles.author, {});
            const outcome = yield* db.workload.importWrite.apply(
              { insert: packageFactsOf(edit(program.inputs)) },
              {},
            );

            assert.strictEqual(outcome.kind, "invariant-rejected", Formatter.format(outcome));
            assert.isTrue(
              outcome.kind === "invariant-rejected" &&
                outcome.refused.laws.some((refused) => sameLaw(refused.law, law)),
              Formatter.format(outcome),
            );
            assert.deepStrictEqual(schemaLawNameOf(law), Option.some(name));
          }).pipe(Effect.scoped),
        leaseTestTimeoutMs,
      );
    }
  });
});

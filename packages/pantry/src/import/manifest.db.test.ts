import { Db } from "@bjornpagen/grizzle";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, Layer } from "effect";
import { describe, inject } from "vitest";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import { changeSetOf, readRows, retrySchedule } from "#pantry/import/package.ts";
import { isMappedLaw, refusalOfLaw, ruleOfLaw } from "#pantry/import/refusal.ts";
import type { ImportLaw } from "#pantry/import/refusal.ts";
import { Rows } from "#pantry/import/tree.ts";
import { AuthorApp } from "#pantry/schema/logins.ts";
import { ManifestSchemaVersion } from "#pantry/schema/package.ts";
import { authorLayerHookTimeoutMs, hasLease, leaseTestTimeoutMs } from "#pantry/test/settings.ts";

/**
 * The lease case of decision 124: a `cp:schemaversion` row that names a version other than its
 * package's is refused by the database, under the rule `refusal.ts` gives the two
 * `ManifestSchemaVersion` containments. The importer's guards refuse a mismatch earlier, so the
 * case writes the changed rows through the author role directly, as the bin 1 cases of
 * `processing.db.test.ts` do. It runs in the merge lease and the freeze, never on a slice.
 */
describe.skipIf(!hasLease)("the database refusal of a mismatched cp:schemaversion", () => {
  layer(Layer.mergeAll(AuthorAppLayer, NodeServices.layer), {
    excludeTestServices: true,
    timeout: authorLayerHookTimeoutMs,
  })("ManifestSchemaVersion's containments", (it) => {
    it.effect(
      "refuses a version its package does not hold under typed-copy",
      () =>
        Effect.gen(function* mismatchedVersion() {
          const { rows } = yield* readRows(inject("fixtures").simple);
          const changed = new Map(rows).set(
            ManifestSchemaVersion,
            Rows.of(rows, ManifestSchemaVersion).map((row) => ({
              ...row,
              version: row.version === "3.0.0" ? "3.0.1" : "3.0.0",
            })),
          );
          const db = yield* Db.open(AuthorApp.roles.author, {});
          const outcome = yield* db.apply(changeSetOf(changed), {}).pipe(
            Effect.retry({
              schedule: retrySchedule,
              while: (e) => e._tag === "TransientFailure",
            }),
          );

          assert.strictEqual(outcome.kind, "invariant-rejected");

          if (outcome.kind === "invariant-rejected") {
            const law: ImportLaw = outcome.law;

            assert.strictEqual(law.kind, "contained");
            assert.isTrue(isMappedLaw(law));
            assert.strictEqual(ruleOfLaw(law), "typed-copy");
            assert.strictEqual(refusalOfLaw(law, outcome.witness).rule, "typed-copy");
          }
        }),
      leaseTestTimeoutMs,
    );
  });
});

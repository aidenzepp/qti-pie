/**
 * A placed ID's copy, on the lease (lane NIL's audit, C1; NS4): the database's verdict over the
 * cases of `#pantry/test/placed-id-copy-cases.ts`.
 *
 * Under a test's assembly a placed ID's copy is its document, a section document placed twice
 * holding its IDs once (reading 86); before NS4 it was the nil uuid, an id the import never mints.
 * Each case's verdict is the law oracle's (`importAgreesWithOracle`): each lawful case accepted,
 * and the one whose merged test holds an ID twice refused under "DocumentId key" (document-key),
 * which the schema states over each assembly (`AssembledId`'s key on `(assembly, id)`) and the
 * oracle too (`#pantry/test/oracle.ts` `assembliesOf`).
 *
 * The host's guard over the same cases is `src/test/placed-id-copy.oracle.test.ts`.
 */
import { NodeServices } from "@effect/platform-node";
import { layer } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { noCoverage } from "@grizzle/testing/features";
import { int } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, Layer } from "effect";
import { describe } from "vitest";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import { scopedPackage } from "#pantry/test/gen/every-relation.ts";
import { importAgreesWithOracle } from "#pantry/test/locate.ts";
import { cases, packageOf, shown } from "#pantry/test/placed-id-copy-cases.ts";
import { authorLayerHookTimeoutMs, hasLease } from "#pantry/test/settings.ts";

describe.skipIf(!hasLease)("import/placed-id-copy.db.test.ts, on the lease", () => {
  layer(Layer.mergeAll(AuthorAppLayer, NodeServices.layer), {
    excludeTestServices: true,
    timeout: authorLayerHookTimeoutMs,
  })("a placed ID's copy, judged by PostgreSQL", (it) => {
    it.effect(
      "the database gives every case the law oracle's verdict, a merged test that holds one ID twice refused under document-key",
      (ctx) =>
        // Oracle: a second implementation, the law oracle's verdict over every case. Bound: a section
        // ID or none, placed once or twice, the test's own ID or none; 8 cases, exhausted.
        searched(
          ctx,
          exhaust(
            {
              box: "a section ID or none, placed once or twice, the test's own ID or none, imported",
              caseHang: Duration.seconds(120),
              coverage: noCoverage,
              generator: int(0, cases.length - 1),
              limit: cases.length,
              literal: (at) => {
                const drawnCase = cases[at];

                return drawnCase === undefined ? String(at) : shown(drawnCase);
              },
              oracle: { kind: "second-implementation", name: "the law oracle's verdict" },
              suite: "pantry/placed-id-copy-db",
            },
            (at) =>
              Effect.gen(function* placedIdCopyAgrees() {
                const drawnCase = cases[at];
                if (drawnCase === undefined) {
                  return;
                }

                const dir = yield* scopedPackage(packageOf(drawnCase));
                yield* importAgreesWithOracle(dir, shown(drawnCase));
              }).pipe(Effect.scoped),
          ),
        ),
      3_600_000,
    );
  });
});

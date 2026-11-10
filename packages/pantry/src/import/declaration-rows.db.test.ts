/**
 * Declarations whose cardinality or base type spells nothing, on the lease (lane NIL's audit, B11;
 * spec reading 158): the database's verdict over the scope of `#pantry/test/declaration-cases.ts`,
 * held to the law oracle's (`importAgreesWithOracle`).
 *
 * A declaration whose `cardinality` or `base-type` is unwritten or spells nothing keeps its
 * `Declaration` row and every row below it, and has no `DeclarationCardinality` or
 * `DeclarationBaseType` alone; one with no cardinality has no `DeclarationName` either, and a
 * binding or a reference still resolves to it by name, reading no cardinality of it (spec reading
 * 159; `#pantry/import/overlays/declarations.ts` `typedDeclarationOf`). Before, it had a row
 * holding `""` and `single`, which its own `E1_derived` refused, and every row that copied it
 * judged the `single`; later it had no row at all, so the copies its children ask broke beside its
 * own law. Each case is now refused by AL3 or the value domain, or, where its references name no
 * declaration, by one of the laws the oracle names beside them.
 *
 * The host's guard over the same scope, with the rows, is
 * `src/test/declaration-rows.oracle.test.ts`.
 */
import { NodeServices } from "@effect/platform-node";
import { layer } from "@effect/vitest";
import { drawn, explore } from "@grizzle/testing/explore";
import { completeShrink } from "@grizzle/testing/shrink";
import { noCoverage } from "@grizzle/testing/features";
import { int } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, Layer } from "effect";
import { describe } from "vitest";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import {
  declarationCase,
  declarationSites,
  declarationStates,
} from "#pantry/test/declaration-cases.ts";
import { scopedPackage } from "#pantry/test/gen/every-relation.ts";
import { importAgreesWithOracle } from "#pantry/test/oracle-verdict.ts";
import { hasLease } from "#pantry/test/settings.ts";

/**
 * Every (site, state) of the scope, by its number.
 */
const cases = declarationSites.flatMap((site) =>
  declarationStates.filter((state) => state.applies(site)).map((state) => ({ site, state })),
);

describe.skipIf(!hasLease)("import/declaration-rows.db.test.ts, on the lease", () => {
  layer(Layer.mergeAll(AuthorAppLayer, NodeServices.layer), {
    excludeTestServices: true,
  })("declarations whose cardinality or base type spells nothing, judged by PostgreSQL", (it) => {
    it.effect(
      "the database refuses every case under a rule the law oracle predicts",
      (ctx) =>
        // Oracle: a second implementation, the law oracle's verdict over the same entries. Bound:
        // 32 of the 294 (declaration, untyped state) cases of the every-relation items and test,
        // drawn from the run's seed, one import each; `src/test/declaration-rows.oracle.test.ts`
        // exhausts the scope against the same oracle on the host.
        searched(
          ctx,
          explore(
            {
              caseHang: Duration.seconds(120),
              concurrency: 1,
              coverage: noCoverage,
              draw: drawn(int(0, cases.length - 1)),
              kept: [],
              literal: (at) => {
                const held = cases[at];

                return held === undefined
                  ? String(at)
                  : `${held.site.path} ${held.site.identifier} ${held.state.name}`;
              },
              oracle: { kind: "second-implementation", name: "the law oracle's verdict" },
              runs: 32,
              shrink: completeShrink,
              steerEvery: 16,
              suite: "pantry/declaration-rows-db",
            },
            (at) =>
              Effect.gen(function* declarationRowAgrees() {
                const held = cases[at];
                if (held === undefined) {
                  return;
                }

                const dir = yield* scopedPackage(declarationCase(held.site, held.state));
                yield* importAgreesWithOracle(
                  dir,
                  `${held.site.path} ${held.site.identifier} ${held.state.name}`,
                );
              }).pipe(Effect.scoped),
          ),
        ),
      3_600_000,
    );
  });
});

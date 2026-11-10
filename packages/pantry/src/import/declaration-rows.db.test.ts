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
import { exhaust } from "@grizzle/testing/explore";
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
        // Oracle: a second implementation, the law oracle's verdict over the same entries. Bound: every declaration of the every-relation items
        // and test, under each state of its cardinality and base type that spells nothing,
        // exhausted, one import each.
        searched(
          ctx,
          exhaust(
            {
              box: "every declaration of the every-relation items and test, under each untyped state, imported",
              caseHang: Duration.seconds(120),
              coverage: noCoverage,
              generator: int(0, cases.length - 1),
              limit: cases.length,
              literal: (at) => {
                const drawn = cases[at];

                return drawn === undefined
                  ? String(at)
                  : `${drawn.site.path} ${drawn.site.identifier} ${drawn.state.name}`;
              },
              oracle: { kind: "second-implementation", name: "the law oracle's verdict" },
              suite: "pantry/declaration-rows-db",
            },
            (at) =>
              Effect.gen(function* declarationRowAgrees() {
                const drawn = cases[at];
                if (drawn === undefined) {
                  return;
                }

                const dir = yield* scopedPackage(declarationCase(drawn.site, drawn.state));
                yield* importAgreesWithOracle(
                  dir,
                  `${drawn.site.path} ${drawn.site.identifier} ${drawn.state.name}`,
                );
              }).pipe(Effect.scoped),
          ),
        ),
      3_600_000,
    );
  });
});

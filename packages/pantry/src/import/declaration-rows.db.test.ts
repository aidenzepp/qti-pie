/**
 * Declarations that have no `Declaration` row, on the lease (lane NIL's audit, B11): the
 * database's verdict over the scope of `#pantry/test/declaration-cases.ts`, held to the law
 * oracle's (`importAgreesWithOracle`).
 *
 * A declaration whose `cardinality` is unwritten or spells nothing, or whose `base-type` spells
 * nothing, has no `Declaration` row, and nothing binds, references or hangs from it in the
 * importer's rows (`#pantry/import/overlays/declarations.ts` `typedDeclarationOf`); one whose
 * `identifier` is unwritten or names nothing keeps its row and has no name alone (spec reading
 * 157).
 * Before, it had a row holding `""` and `single`, which its own `E1_derived` refused, and every row
 * that copied it judged the `single`. grizzle writes those flat relations before `Node` and
 * `Attribute`, whose AL3 and value domain are the laws, so such a package was refused under
 * `derived` or a fit law, which the oracle does not name (lane N2's binding-fit tier). Each case
 * is now refused by AL3 or the value domain, or, where its references name no declaration, by one
 * of the laws the oracle names beside them.
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
import { authorLayerHookTimeoutMs, hasLease } from "#pantry/test/settings.ts";

/**
 * Every (site, state) of the scope, by its number.
 */
const cases = declarationSites.flatMap((site) =>
  declarationStates.filter((state) => state.applies(site)).map((state) => ({ site, state })),
);

describe.skipIf(!hasLease)("import/declaration-rows.db.test.ts, on the lease", () => {
  layer(Layer.mergeAll(AuthorAppLayer, NodeServices.layer), {
    excludeTestServices: true,
    timeout: authorLayerHookTimeoutMs,
  })("declarations with no Declaration row, judged by PostgreSQL", (it) => {
    it.effect(
      "the database refuses every case under a rule the law oracle predicts",
      (ctx) =>
        // Oracle: a second implementation, the law oracle's verdict over the same entries. Bound: every declaration of the every-relation items
        // and test, under each state of its cardinality and base type that leaves it no row,
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

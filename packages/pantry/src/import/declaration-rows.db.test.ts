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
import { AuthorAppLayer } from "#pantry/cli/layer.ts";
import {
  declarationCase,
  declarationSites,
  declarationStates,
} from "#pantry/test/declaration-cases.ts";
import { scopedPackage } from "#pantry/test/gen/every-relation.ts";
import { importAgreesWithOracle } from "#pantry/test/oracle-verdict.ts";
import { hasLease } from "#pantry/test/settings.ts";

/**
 * The declaration kinds the base writes, in their first site's order.
 */
const kinds = [...new Set(declarationSites.map(({ kind }) => kind))];

/**
 * Each state once, at the first site it applies to of a kind that turns with the state's place, so
 * the box meets every state and every declaration kind: built, not drawn. Only the first
 * declaration of each kind in each document is a site (`ordinal` 0), the scope
 * `src/test/declaration-rows.oracle.test.ts` exhausts on the host, which so holds every case here.
 */
const cases = declarationStates.flatMap((state, at) => {
  const applicable = declarationSites.filter((site) => site.ordinal === 0 && state.applies(site));
  const site = applicable.find(({ kind }) => kind === kinds[at % kinds.length]) ?? applicable[0];

  return site === undefined ? [] : [{ site, state }];
});

describe.skipIf(!hasLease)("import/declaration-rows.db.test.ts, on the lease", () => {
  layer(Layer.mergeAll(AuthorAppLayer, NodeServices.layer), {
    excludeTestServices: true,
  })("declarations whose cardinality or base type spells nothing, judged by PostgreSQL", (it) => {
    it.effect(
      "the database refuses every case under a rule the law oracle predicts",
      (ctx) =>
        // Oracle: a second implementation, the law oracle's verdict over the same entries. Bound:
        // every untyped state once, 9 cases, each at a declaration of a kind the box turns through,
        // exhausted, one import each; `src/test/declaration-rows.oracle.test.ts` exhausts the
        // (declaration, state) scope against the same oracle on the host.
        searched(
          ctx,
          exhaust(
            {
              box: "every untyped state once, at a declaration of each kind in turn",
              caseHang: Duration.seconds(120),
              coverage: noCoverage,
              generator: int(0, cases.length - 1),
              limit: cases.length,
              literal: (at) => {
                const held = cases[at];

                return held === undefined
                  ? String(at)
                  : `${held.site.path} ${held.site.identifier} ${held.state.name}`;
              },
              oracle: { kind: "second-implementation", name: "the law oracle's verdict" },
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

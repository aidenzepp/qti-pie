/**
 * Choices and their interactions, on the lease (lane NIL's audit, B5 and B6): the database's
 * verdict over the small scope of `#pantry/test/choice-owner-cases.ts`, held to the law oracle's
 * (`importAgreesWithOracle`).
 *
 * Before `Interaction` and `ChoiceInteraction`, a choice's interaction was `Choice.interaction`,
 * the counted family's group key under `Binding`: the document node where no interaction enclosed
 * the choice, and an interaction with no `Binding` where it wrote no `response-identifier`. grizzle
 * refused both on the host, appending to an owner the ChangeSet does not insert, before any
 * statement, so a gap outside a gap-match and an interaction with no `response-identifier` were
 * refused under no rule of the schema, where the oracle names N6 ancestry and AL3. Now every
 * interaction has its `Interaction`, a choice its `ChoiceInteraction` only where an interaction
 * encloses it, and each case is refused by its own law, an immediate CHECK on `Node`, or accepted:
 * a gap fragment placed in a gap-match, whose choices are then its own and the fragment's.
 *
 * The host's guard over the same scope, with the rows and the family laws, is
 * `src/test/choice-owner.oracle.test.ts`.
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
import { choiceOwnerPackage, shownCase, smallScope } from "#pantry/test/choice-owner-cases.ts";
import { scopedPackage } from "#pantry/test/gen/every-relation.ts";
import { importAgreesWithOracle } from "#pantry/test/oracle-verdict.ts";
import { authorLayerHookTimeoutMs, hasLease } from "#pantry/test/settings.ts";

describe.skipIf(!hasLease)("import/choice-owner.db.test.ts, on the lease", () => {
  layer(Layer.mergeAll(AuthorAppLayer, NodeServices.layer), {
    excludeTestServices: true,
    timeout: authorLayerHookTimeoutMs,
  })("choices and their interactions, judged by PostgreSQL", (it) => {
    it.effect(
      "the database refuses every case under a rule the law oracle predicts, or accepts it where the oracle does",
      (ctx) =>
        // Oracle: a second implementation, the law oracle's verdict over the same entries. Bound: 5 interaction kinds x named or not x 4 gap
        // placements, 40 cases, exhausted, one import each.
        searched(
          ctx,
          exhaust(
            {
              box: "one interaction of each kind, named or not, under each gap placement, imported",
              caseHang: Duration.seconds(120),
              coverage: noCoverage,
              generator: int(0, smallScope.length - 1),
              limit: smallScope.length,
              literal: (at) => {
                const drawnCase = smallScope[at];

                return drawnCase === undefined ? String(at) : shownCase(drawnCase);
              },
              oracle: { kind: "second-implementation", name: "the law oracle's verdict" },
              suite: "pantry/choice-owner-db",
            },
            (at) =>
              Effect.gen(function* choiceOwnerAgrees() {
                const drawnCase = smallScope[at];
                if (drawnCase === undefined) {
                  return;
                }

                const dir = yield* scopedPackage(choiceOwnerPackage(drawnCase));
                yield* importAgreesWithOracle(dir, shownCase(drawnCase));
              }).pipe(Effect.scoped),
          ),
        ),
      3_600_000,
    );
  });
});

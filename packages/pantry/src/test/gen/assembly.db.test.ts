/**
 * The assembly generator's packages imported on the lease (R87): the database judges reading 87,
 * and its verdict must be the generator's model's (`#pantry/test/gen/assembly.ts`
 * `modelVerdict`). Every package of the small box and a swarm's sample past it is imported in one
 * ChangeSet. An accepted import is the model's accepted, and a refused one is the model's refused,
 * under the rule of one of the faults it finds: a target that resolves nowhere or names an element
 * of the wrong kind or part under `branch-target`, one that is not after its source under
 * `branch-forward`. A package whose faults are all of one rule is refused under that rule alone:
 * a resolution with no target breaks only its existence law, and `Branch_forward` judges only a
 * target `Branch_target` admits, so no target breaks both.
 *
 * The model is this test's oracle, not `importAgreesWithOracle`: it is reading 87's reference, and
 * the law oracle, which states `Branch target` and `Branch forward`
 * (`#pantry/test/oracle-laws/tests.ts`), is held to it by
 * `oracle-laws.differential.oracle.test.ts`.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { drawn, exhaust, explore } from "@grizzle/testing/explore";
import { noCoverage } from "@grizzle/testing/features";
import { completeShrink } from "@grizzle/testing/shrink";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, Layer, Result } from "effect";
import { describe } from "vitest";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import { importPackage } from "#pantry/import/package.ts";
import { ImportRefused } from "#pantry/import/refusal.ts";
import {
  assemblyLiteral,
  assemblyPackage,
  modelVerdict,
  sampledBounds,
  smallAssembly,
  swarmedAssembly,
} from "#pantry/test/gen/assembly.ts";
import type { Assembly, RuleFault } from "#pantry/test/gen/assembly.ts";
import { scopedPackage } from "#pantry/test/gen/every-relation.ts";
import { authorLayerHookTimeoutMs, hasLease } from "#pantry/test/settings.ts";

/**
 * The rule a fault of reading 87's model is refused under: a target that resolves nowhere, or to a
 * name of the wrong kind or part, "Branch target"; one that is not after its source, "Branch
 * forward".
 *
 * @param fault - The fault.
 * @returns The rule.
 */
const ruleOfFault = (fault: RuleFault): string =>
  fault === "forward" ? "branch-forward" : "branch-target";

/**
 * Import one generated package and hold the database's verdict to reading 87's model.
 *
 * @param assembly - The package.
 * @returns Nothing; fails the case on a disagreement.
 */
const importJudged = (assembly: Assembly) =>
  Effect.gen(function* judgedOnLease() {
    const literal = assemblyLiteral(assembly);
    const predicted = modelVerdict(assembly);
    const outcome = yield* Effect.result(
      importPackage(yield* scopedPackage(assemblyPackage(assembly))),
    );

    if (Result.isSuccess(outcome)) {
      assert.strictEqual(predicted.kind, "accepted", `${literal} was accepted`);
    } else if (outcome.failure instanceof ImportRefused) {
      const refused = outcome.failure;

      assert.strictEqual(predicted.kind, "refused", `${literal} was refused: ${refused.message}`);

      const rules = new Set(
        predicted.kind === "refused" ? [...predicted.faults].map(ruleOfFault) : [],
      );
      assert.isTrue(
        rules.has(refused.rule),
        `${literal} was refused under ${refused.rule}, and the model's faults are ${[...rules].join(", ")}: ${refused.message}`,
      );
    } else {
      assert.fail(`${literal} failed with ${outcome.failure.message}`);
    }
  }).pipe(Effect.scoped);

describe.skipIf(!hasLease)("test/gen/assembly.ts, on the lease", { timeout: 3_600_000 }, () => {
  layer(Layer.mergeAll(AuthorAppLayer, NodeServices.layer), {
    excludeTestServices: true,
    timeout: authorLayerHookTimeoutMs,
  })("each generated package imported and judged by PostgreSQL", (it) => {
    it.effect(
      "every package of the small box is accepted or refused as reading 87's model says",
      (ctx) =>
        // Oracle: a specification, reading 87's bullets over the assembled test (`modelVerdict`),
        // against PostgreSQL's verdict on the import's one ChangeSet. Bound: the small box's 308
        // packages.
        searched(
          ctx,
          exhaust(
            {
              box: "11 shapes of at most two parts, three item refs, one nesting and a chain of two documents, with one branch rule of every owner and target",
              caseHang: Duration.seconds(60),
              coverage: noCoverage,
              generator: smallAssembly,
              limit: 400,
              literal: assemblyLiteral,
              oracle: {
                kind: "specification",
                name: "reading 87's bullets over the assembled test",
              },
              suite: "pantry/test/gen-assembly-db-box",
            },
            importJudged,
          ),
        ),
    );

    it.effect("every sampled package is accepted or refused as reading 87's model says", (ctx) =>
      // Oracle: as the box's. Bound: 40 packages past the box, each under its own swarm.
      searched(
        ctx,
        explore(
          {
            caseHang: Duration.seconds(60),
            concurrency: 1,
            coverage: noCoverage,
            draw: drawn(swarmedAssembly(sampledBounds)),
            kept: [],
            literal: ({ assembly }) => assemblyLiteral(assembly),
            oracle: { kind: "specification", name: "reading 87's bullets over the assembled test" },
            runs: 40,
            shrink: completeShrink,
            steerEvery: 16,
            suite: "pantry/test/gen-assembly-db-swarm",
          },
          ({ assembly }) => importJudged(assembly),
        ),
      ),
    );
  });
});

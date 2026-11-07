/**
 * The site generator's packages imported on the lease (lane NIL, the SitePath fix; spec readings
 * 114 and 115): the database judges each site's href, and its verdict must be the case table's
 * (`#pantry/test/gen/sites.ts` `rulesOfBox`) and the law oracle's (`#pantry/test/oracle-verdict.ts`
 * `oracleVerdict`). A package whose one fault is an href naming an absent file is refused under
 * `file-exists` alone, `SitePath`'s `File_exists` CHECK, which PostgreSQL meets as the row is
 * inserted, before any deferred key; one whose one fault is an include with no href, under
 * `include-target` alone: the site has no `SitePath`, so no stand-in path breaks the href's
 * reachability beside it.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { noCoverage } from "@grizzle/testing/features";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, Layer, Result } from "effect";
import { describe } from "vitest";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import { importPackage } from "#pantry/import/package.ts";
import { ImportRefused } from "#pantry/import/refusal.ts";
import { readPackage } from "#pantry/package/read.ts";
import { scopedPackage } from "#pantry/test/gen/every-relation.ts";
import {
  outsideRulesOfBox,
  rulesOfBox,
  siteBox,
  siteLiteral,
  sitePackage,
} from "#pantry/test/gen/sites.ts";
import type { SiteBox } from "#pantry/test/gen/sites.ts";
import { oracleVerdict } from "#pantry/test/oracle-verdict.ts";
import { authorLayerHookTimeoutMs, hasLease } from "#pantry/test/settings.ts";

/**
 * Import one package of the box and hold the database's verdict to the case table's
 * (`rulesOfBox`, with `outsideRulesOfBox`'s rules beside the site laws) and the law oracle's:
 * accepted exactly where both accept; refused under a rule of the table that the oracle names too,
 * and where the table names one rule, that rule alone, so
 * an href naming an absent file is refused under `file-exists` and an include with no href under
 * `include-target`, whatever order PostgreSQL's deferred keys run in.
 *
 * @param box - The package.
 * @returns Nothing; fails the case on a disagreement.
 */
const importJudged = (box: SiteBox) =>
  Effect.gen(function* judgedOnLease() {
    const literal = siteLiteral(box);
    const dir = yield* scopedPackage(sitePackage(box));
    const verdict = yield* oracleVerdict(yield* readPackage(dir));
    const rules = new Set([...rulesOfBox(box), ...outsideRulesOfBox(box)]);
    const outcome = yield* Effect.result(importPackage(dir));
    if (Result.isSuccess(outcome)) {
      assert.strictEqual(rules.size, 0, `${literal} was accepted`);
      assert.strictEqual(verdict.kind, "accepted", `${literal} was accepted`);

      return;
    }

    const refused = outcome.failure;
    if (!(refused instanceof ImportRefused)) {
      assert.fail(`${literal} failed with ${refused.message}`);
    }

    const [only] = rules;
    assert.isTrue(
      rules.size === 1 ? refused.rule === only : rules.has(refused.rule),
      `${literal} was refused under ${refused.rule}, and its cases' rules are ${[...rules].join(", ")}: ${refused.message}`,
    );
    assert.isTrue(
      verdict.kind === "refused" && verdict.rules.has(refused.rule),
      `${literal} was refused under ${refused.rule}, which the law oracle does not name`,
    );
  }).pipe(Effect.scoped);

describe.skipIf(!hasLease)("test/gen/sites.ts, on the lease", { timeout: 3_600_000 }, () => {
  layer(Layer.mergeAll(AuthorAppLayer, NodeServices.layer), {
    excludeTestServices: true,
    timeout: authorLayerHookTimeoutMs,
  })("each package of the site box imported and judged by PostgreSQL", (it) => {
    it.effect(
      "gives every package of the site box the law oracle's verdict, and an include with no href include-target alone",
      (ctx) =>
        // Oracle: the specification as a checker, reading 115 and §7.5 per case (`ruleOfCase`),
        // and a second implementation, the law oracle over the same entries.
        // Bound: the every-relation package's three sites, each listed, naming an absent file, an
        // entry listed as no document or a file outside the package, or writing no href, 125.
        searched(
          ctx,
          exhaust(
            {
              box: "the every-relation package's include of fragment.xml, include of rules.xml and section ref of section.xml, each listed, naming an absent file, an entry listed as no document or an external file, or writing no href",
              caseHang: Duration.seconds(120),
              coverage: noCoverage,
              generator: siteBox,
              limit: 125,
              literal: siteLiteral,
              oracle: {
                kind: "second-implementation",
                name: "the law oracle over the same entries",
              },
              suite: "pantry/test/gen-sites-db-box",
            },
            importJudged,
          ),
        ),
    );
  });
});

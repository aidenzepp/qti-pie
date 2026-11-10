/**
 * The site generator's packages imported on the lease (lane NIL, the SitePath fix; spec readings
 * 114 and 115): the database judges each site's href, and its verdict must be the case table's
 * (`#pantry/test/gen/sites.ts` `rulesOfBox`) and the law oracle's (`#pantry/test/oracle-verdict.ts`
 * `oracleVerdict`). A package whose one fault is an href naming an absent file is refused under
 * `file-exists` alone, `SitePath`'s `File_exists` CHECK, which PostgreSQL meets as the row is
 * inserted, before any deferred key; one whose one fault is an include that places nothing, under
 * `include-target` or the fragment's outside rule (`outsideRulesOfBox`): the site has no
 * `SitePath`, so no stand-in path breaks the href's reachability beside it.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { noCoverage } from "@grizzle/testing/features";
import { int } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, Layer, Result } from "effect";
import { describe } from "vitest";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import { importDir } from "#pantry/test/import-dir.ts";
import { readEntries } from "#pantry/package/read.ts";
import { scopedPackage } from "#pantry/test/gen/every-relation.ts";
import {
  hrefCases,
  outsideRulesOfBox,
  rulesOfBox,
  siteLiteral,
  siteNames,
  sitePackage,
} from "#pantry/test/gen/sites.ts";
import type { SiteBox } from "#pantry/test/gen/sites.ts";
import { oracleVerdict } from "#pantry/test/oracle-verdict.ts";
import { hasLease } from "#pantry/test/settings.ts";
import { ImportRefused } from "#pantry/import/rules.ts";

/**
 * Import one package of the box and hold the database's verdict to the case table's
 * (`rulesOfBox`, with `outsideRulesOfBox`'s rules beside the site laws) and the law oracle's:
 * accepted exactly where both accept; refused under a rule of the table that the oracle names too,
 * and where the table names one rule, that rule alone, so an href naming an absent file is refused
 * under `file-exists` alone, and an include that places nothing under `include-target` or the
 * fragment's outside rule, whatever order PostgreSQL's deferred keys run in.
 *
 * @param box - The package.
 * @returns Nothing; fails the case on a disagreement.
 */
const importJudged = (box: SiteBox) =>
  Effect.gen(function* judgedOnLease() {
    const literal = siteLiteral(box);
    const dir = yield* scopedPackage(sitePackage(box));
    const verdict = yield* oracleVerdict(yield* readEntries(dir));
    const rules = new Set([...rulesOfBox(box), ...outsideRulesOfBox(box)]);
    const outcome = yield* Effect.result(importDir(dir));
    if (Result.isSuccess(outcome)) {
      assert.strictEqual(rules.size, 0, `${literal} was accepted`);
      assert.strictEqual(verdict.kind, "accepted", `${literal} was accepted`);

      return;
    }

    const refused = outcome.failure;
    if (!(refused instanceof ImportRefused)) {
      assert.fail(`${literal} failed with ${refused.message}`);
    }

    if (rules.size === 1) {
      assert.deepStrictEqual(
        [...new Set(refused.rules)],
        [...rules],
        `${literal} was refused under ${refused.rules.join(", ")}, and its cases' one rule is ${[...rules].join(", ")}, alone: ${refused.message}`,
      );
    } else {
      assert.isTrue(
        refused.rules.some((rule) => rules.has(rule)),
        `${literal} was refused under ${refused.rules.join(", ")}, and its cases' rules are ${[...rules].join(", ")}: ${refused.message}`,
      );
    }

    assert.isTrue(
      verdict.kind === "refused" && refused.rules.some((rule) => verdict.rules.has(rule)),
      `${literal} was refused under ${refused.rules.join(", ")}, none of which the law oracle names`,
    );
  }).pipe(Effect.scoped);

/**
 * The package whose every site is listed: the every-relation package itself.
 */
const allListed: SiteBox = { fragment: "listed", rules: "listed", section: "listed" };

/**
 * Each site alone in each case but listed, the other two listed: one package per row of the case
 * table (`ruleOfCase`), built, not drawn.
 */
const singleFaults: readonly SiteBox[] = siteNames.flatMap((name) =>
  hrefCases.flatMap((href): readonly SiteBox[] =>
    href === "listed" ? [] : [{ ...allListed, [name]: href }],
  ),
);

describe.skipIf(!hasLease)("test/gen/sites.ts, on the lease", { timeout: 3_600_000 }, () => {
  layer(Layer.mergeAll(AuthorAppLayer, NodeServices.layer), {
    excludeTestServices: true,
  })("each package of the site box imported and judged by PostgreSQL", (it) => {
    it.effect(
      "gives each site's every faulted case the law oracle's verdict, and an include that places nothing include-target or the fragment's outside rule",
      (ctx) =>
        // Oracle: the specification as a checker, reading 115 and §7.5 per case (`ruleOfCase`),
        // and a second implementation, the law oracle over the same entries.
        // Bound: every site of the every-relation package alone in each of its 4 faulted cases
        // (naming an absent file, an entry listed as no document or a file outside the package, or
        // writing no href), the other two listed: 12 packages, every row of the case table,
        // exhausted; `sites.test.ts` exhausts the 125 packages of the whole box on the host, and
        // the all-listed package is the every-relation package every lease file accepts.
        searched(
          ctx,
          exhaust(
            {
              box: "each site alone in each faulted case, the others listed",
              caseHang: Duration.seconds(120),
              coverage: noCoverage,
              generator: int(0, singleFaults.length - 1),
              limit: singleFaults.length,
              literal: (at) => {
                const box = singleFaults[at];

                return box === undefined ? String(at) : siteLiteral(box);
              },
              oracle: {
                kind: "second-implementation",
                name: "the law oracle over the same entries",
              },
              suite: "pantry/test/gen-sites-db-box",
            },
            (at) => {
              const box = singleFaults[at];

              return box === undefined ? Effect.void : importJudged(box);
            },
          ),
        ),
    );
  });
});

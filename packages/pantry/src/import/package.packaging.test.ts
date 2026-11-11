/**
 * The packaging fixtures on the lease (the spec's 4.12 to 4.14), PostgreSQL the judge: each
 * fixture's verdict is the law oracle's (`#pantry/test/oracle-verdict.ts`, a second
 * implementation), and a dangling include is refused under the law it breaks.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { drawn, explore } from "@grizzle/testing/explore";
import { noCoverage } from "@grizzle/testing/features";
import { int } from "@grizzle/testing/gen";
import { completeShrink } from "@grizzle/testing/shrink";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, Layer } from "effect";
import { describe } from "vitest";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import { importDir } from "#pantry/test/import-dir.ts";
import { materialize } from "#pantry/test/fixtures.ts";
import { importAgreesWithOracle, packagingFixtures } from "#pantry/test/oracle-verdict.ts";
import { danglingIncludeName, materializeProcessing } from "#pantry/test/processing-fixtures.ts";
import { hasLease, leaseTestTimeoutMs } from "#pantry/test/settings.ts";
import { ImportRefused } from "#pantry/import/rules.ts";

/**
 * The packaging search's timeout, in milliseconds: a hang guard past the describe's, which
 * `searched` reads as its deadline.
 */
const searchTimeoutMs = 600_000;

describe.skipIf(!hasLease)(
  "import/package.packaging.test.ts, on the lease",
  { timeout: leaseTestTimeoutMs },
  () => {
    layer(Layer.mergeAll(AuthorAppLayer, NodeServices.layer), {
      excludeTestServices: true,
      timeout: "120 seconds",
    })("importPackage of the packaging fixtures on the lease", (it) => {
      it.effect(
        "gives each drawn packaging fixture the law oracle's verdict",
        (ctx) =>
          // Oracle: a second implementation, the law oracle's verdict over the same entries. Bound:
          // 12 of the packaging fixtures, drawn from the run's seed, one import each, so the runs
          // between them cover the list.
          searched(
            ctx,
            explore(
              {
                caseHang: Duration.seconds(120),
                concurrency: 1,
                coverage: noCoverage,
                draw: drawn(int(0, packagingFixtures.length - 1)),
                kept: [],
                literal: (at) => packagingFixtures[at] ?? String(at),
                oracle: { kind: "second-implementation", name: "the law oracle's verdict" },
                runs: 12,
                shrink: completeShrink,
                steerEvery: 16,
                suite: "pantry/package-packaging-db",
              },
              (at) =>
                Effect.gen(function* oracleAgrees() {
                  const name = packagingFixtures[at];
                  if (name === undefined) {
                    return;
                  }

                  yield* importAgreesWithOracle(yield* materialize(name), name);
                }),
            ),
          ),
        searchTimeoutMs,
      );

      it.effect(`refuses ${danglingIncludeName} by the law its dangling include breaks`, () =>
        // Oracle: the specification as a checker, reading 115: an include whose href names no
        // document the manifest lists is refused under "Include target", the import's own
        // ChangeSet writing its site with no SiteTarget, never by an engine refusal of a write to
        // a document the change does not insert. dangling-include names a file only a resource's
        // file entry lists, so include-target alone refuses it.
        Effect.gen(function* includeTarget() {
          const refused = yield* Effect.flip(
            importDir(yield* materializeProcessing(danglingIncludeName)),
          );
          const named: readonly string[] =
            refused instanceof ImportRefused ? refused.rules : [refused._tag];

          assert.include(
            named,
            "include-target",
            `${danglingIncludeName}: refused under ${named.join(", ")}`,
          );
        }),
      );
    });
  },
);

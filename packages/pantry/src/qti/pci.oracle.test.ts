/**
 * Phase 10's PCI negatives held to the law oracle, on the free tier: each is refused, and where the
 * oracle's breaches keep one rule, under one its row of `pciVerdicts` allows (the GEN-A rule,
 * research c92da8fd). The database's own verdict over imported packages is the law oracle's
 * (`#pantry/import/program.oracle.db.test.ts`), so these need no lease.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect } from "effect";
import { readEntries } from "#pantry/package/read.ts";
import { materialize, pciNegativeNames, pciVerdicts } from "#pantry/test/fixtures.ts";
import { oracleVerdict } from "#pantry/test/oracle-verdict.ts";

layer(NodeServices.layer, { excludeTestServices: true })("qti/pci.oracle.test.ts", (it) => {
  it.effect(
    "refuses every PCI negative, under one of the rules its row allows where one is kept",
    () =>
      // Oracle: the predicted column of the spec's 4.5 table (`pciVerdicts`), against the law
      // oracle's verdict on each package.
      // Bound: every negative of `pciNegativeNames`.
      Effect.gen(function* negatives() {
        for (const name of pciNegativeNames) {
          const allowed = pciVerdicts.find(([row]) => row === name)?.[1] ?? [];
          const verdict = yield* oracleVerdict(yield* readEntries(yield* materialize(name)));
          const rules = verdict.kind === "refused" ? [...verdict.rules] : [];

          assert.strictEqual(verdict.kind, "refused", `${name}: the oracle accepts it`);
          if (rules.length === 1) {
            assert.include(allowed, rules[0], `${name}: the oracle's ${rules.join(", ")}`);
          }
        }
      }).pipe(Effect.scoped),
  );
});

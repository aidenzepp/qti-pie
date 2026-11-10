/**
 * The test layer's whole-package cases through the importer, on the lease (Q5.15): each case is a
 * fixture package imported in one ChangeSet, PostgreSQL the judge.
 *
 * A refused case may name any rule of the set beside it, since the importer names the rule of the
 * first object that refuses: `item-ref-missing` names no entry, so `file-exists` and
 * `item-ref-target` both refuse it. The negatives' sets hold the law oracle's rules, pinned free in
 * `#pantry/test/negatives.oracle.test.ts` `expectations`, and `section-ref-to-item`'s also admits
 * `inclusion-cycle`. The assembly fixtures (`#pantry/test/fixtures.ts` `assemblyNames`) take the
 * verdicts their fixtures were built for: a section document placed twice is accepted, and so is a
 * branch rule inside it that names a later item ref of the same document (reading 87, which judges
 * "after" over the assembled test); a backward branch is accepted only where its section shuffles
 * (reading 87), a branch to its own section is refused under `branch-forward`, an item ref that
 * shares a section's identifier in the assembly under `test-name-key`, and a selection that equals
 * its required parts is accepted.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, Layer, Result } from "effect";
import { describe } from "vitest";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import { importDir } from "#pantry/test/import-dir.ts";
import { materialize } from "#pantry/test/fixtures.ts";
import type { FixtureName } from "#pantry/test/fixtures.ts";
import { hasLease, leaseTestTimeoutMs } from "#pantry/test/settings.ts";
import { ImportRefused } from "#pantry/import/rules.ts";
import type { Rule } from "#pantry/import/rules.ts";

/**
 * Each whole-package case with its verdict: accepted, or the rules its refusal may name.
 */
const cases = [
  ["section-ref-cycle", ["inclusion-cycle"]],
  ["test-section-ref", "accepted"],
  ["section-doc-twice", "accepted"],
  ["section-doc-name-clash", ["test-name-key"]],
  ["branch-backward", ["branch-forward"]],
  ["branch-backward-shuffled", "accepted"],
  ["branch-to-own-section", ["branch-forward"]],
  ["branch-replacement-target", ["branch-target"]],
  ["item-ref-missing", ["file-exists", "item-ref-target"]],
  ["section-ref-to-item", ["entry-kind", "inclusion-cycle"]],
  ["select-under-required", ["selection-required"]],
  ["select-two-required", "accepted"],
  ["branch-in-twice-placed-section", "accepted"],
] as const satisfies readonly (readonly [FixtureName, "accepted" | readonly Rule[]])[];

describe.skipIf(!hasLease)(
  "import/tests.assembly.db.test.ts, on the lease",
  { timeout: leaseTestTimeoutMs },
  () => {
    layer(Layer.mergeAll(AuthorAppLayer, NodeServices.layer), {
      excludeTestServices: true,
    })("the test layer's whole-package cases, imported", (it) => {
      for (const [name, verdict] of cases) {
        it.effect(
          verdict === "accepted"
            ? `accepts ${name}`
            : `refuses ${name} naming ${verdict.join(" or ")}`,
          () =>
            // Oracle: the case's laws, as the table above states them, judged by PostgreSQL in the
            // importer's one ChangeSet.
            Effect.gen(function* importsCase() {
              const outcome = yield* Effect.result(importDir(yield* materialize(name)));

              if (Result.isSuccess(outcome)) {
                assert.strictEqual(verdict, "accepted", `${name}: accepted`);
              } else if (outcome.failure instanceof ImportRefused) {
                const refused = outcome.failure;

                yield* Effect.log(`${name} refused under ${refused.rules[0]}`, refused.detail);

                assert.notStrictEqual(
                  verdict,
                  "accepted",
                  `${name}: refused under ${refused.rules[0]}`,
                );
                if (verdict !== "accepted") {
                  assert.include(
                    verdict,
                    refused.rules[0],
                    `${name}: the refusal named another rule`,
                  );
                }
              } else {
                assert.fail(`${name}: failed with ${outcome.failure._tag}`);
              }
            }),
        );
      }
    });
  },
);

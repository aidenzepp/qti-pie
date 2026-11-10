/**
 * Phase 5's test-layer negatives through the importer, on the lease: PostgreSQL the judge. Each
 * negative of `negativeNames` is held to the law oracle's prediction for it, pinned in
 * `#pantry/test/negatives.ts` (`expectations`): where the oracle finds breaches, the import
 * fails with `ImportRefused` under one of their rules; where it accepts the negative, so does the
 * import.
 *
 * The importer names the rule of the first PostgreSQL object that refuses (`import/package.ts`),
 * while the oracle judges every breach, so a negative that breaks several laws may be refused
 * under any of their rules, and one that breaks exactly one law under that law's rule only.
 *
 * The oracle accepts only the four "(direct)" negatives: their spec is their positive's own, and
 * the breach is written by hand into the positive's rows, which the importer cannot do. Imported,
 * each is its positive, and accepted.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, Layer } from "effect";
import { describe } from "vitest";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import { importDir } from "#pantry/test/import-dir.ts";
import { materialize, negativeNames } from "#pantry/test/fixtures.ts";
import { expectations } from "#pantry/test/negatives.ts";
import { hasLease, leaseTestTimeoutMs } from "#pantry/test/settings.ts";
import { ImportRefused } from "#pantry/import/rules.ts";

/**
 * The negatives that witness audit C 62'': a test document whose LOM record states another
 * identifier or another title than the test's own.
 */
const auditWitnesses: ReadonlySet<string> = new Set([
  "test-identifier-mismatch",
  "test-title-mismatch",
]);

describe.skipIf(!hasLease)(
  "import/tests.negatives.db.test.ts, on the lease",
  { timeout: leaseTestTimeoutMs },
  () => {
    layer(Layer.mergeAll(AuthorAppLayer, NodeServices.layer), {
      excludeTestServices: true,
    })("the test-layer negatives through the importer", (it) => {
      for (const name of negativeNames) {
        const { oracle } = expectations[name];
        const witness = auditWitnesses.has(name) ? " (audit C 62''s witness)" : "";

        if (oracle === "accepted") {
          it.effect(`imports the "(direct)" ${name}, as the oracle accepts it`, () =>
            // Oracle: the law oracle accepts the negative's spec, its positive's own, so
            // PostgreSQL accepts the package whole.
            Effect.gen(function* acceptsDirect() {
              yield* importDir(yield* materialize(name));
            }),
          );
        } else {
          it.effect(`refuses ${name} naming ${oracle.join(" or ")}${witness}`, () =>
            // Oracle: PostgreSQL, every law of the schema over the whole package. The importer's
            // rule is one of the oracle's breaches; where the oracle finds exactly one, it is
            // that one.
            Effect.gen(function* refusesNegative() {
              const failure = yield* Effect.flip(importDir(yield* materialize(name)));

              assert.instanceOf(failure, ImportRefused, `${name}: refused by another error`);

              const given = failure instanceof ImportRefused ? failure.rules[0] : undefined;

              assert.include(
                oracle,
                given,
                `${name}: the importer's ${given}, the oracle's ${oracle.join(", ")}`,
              );
            }),
          );
        }
      }
    });
  },
);

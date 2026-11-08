/**
 * Every MathML fixture through the importer, on the lease: PostgreSQL the judge. Each negative of
 * `fixtures.mathml.ts` is refused with `ImportRefused` under the rule its entry states, and each
 * positive is imported, then exported and compared with its record, every entry equal, so the
 * round trip is byte for byte.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, Formatter, Layer } from "effect";
import { describe } from "vitest";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import { compareWithRecord } from "#pantry/export/package.ts";
import { importPackage } from "#pantry/import/package.ts";
import { ImportRefused } from "#pantry/import/refusal.ts";
import {
  materializeMathml,
  mathmlNegatives,
  mathmlPositives,
} from "#pantry/test/fixtures.mathml.ts";
import { authorLayerHookTimeoutMs, hasLease, leaseTestTimeoutMs } from "#pantry/test/settings.ts";

describe.skipIf(!hasLease)(
  "fixtures.mathml.db.test.ts, on the lease",
  { timeout: leaseTestTimeoutMs },
  () => {
    layer(Layer.mergeAll(AuthorAppLayer, NodeServices.layer), {
      excludeTestServices: true,
      timeout: authorLayerHookTimeoutMs,
    })("the MathML fixtures through the importer", (it) => {
      for (const { name, rule } of mathmlNegatives) {
        it.effect(`refuses ${name} under ${rule}`, () =>
          // Oracle: PostgreSQL, every law of the schema over the whole package, with the
          // importer's rule the fixture's entry states.
          Effect.gen(function* refused() {
            const failure = yield* Effect.flip(importPackage(yield* materializeMathml(name)));

            assert.instanceOf(failure, ImportRefused);
            assert.strictEqual(failure instanceof ImportRefused ? failure.rule : undefined, rule);
          }),
        );
      }

      for (const { name } of mathmlPositives) {
        it.effect(`imports ${name} and exports it equal to its record`, () =>
          // Oracle: PostgreSQL accepts the package whole, and the exporter's account of the
          // stored `Entry` family equals the entries it was imported from.
          Effect.gen(function* roundTrips() {
            const id = yield* importPackage(yield* materializeMathml(name));
            const report = yield* compareWithRecord(id);

            assert.isFalse(
              report.some(({ outcome }) => outcome.kind === "differs"),
              Formatter.format(report),
            );
          }),
        );
      }
    });
  },
);

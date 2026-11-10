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
import { importDir } from "#pantry/test/import-dir.ts";
import { readEntries } from "#pantry/package/read.ts";
import {
  materializeMathml,
  mathmlNegatives,
  mathmlPositives,
} from "#pantry/test/fixtures.mathml.ts";
import { judge, ruleOf } from "#pantry/test/oracle.ts";
import { grammar, laws } from "#pantry/test/probe.ts";
import { hasLease, leaseTestTimeoutMs } from "#pantry/test/settings.ts";
import { ImportRefused } from "#pantry/import/rules.ts";

describe.skipIf(!hasLease)(
  "fixtures.mathml.db.test.ts, on the lease",
  { timeout: leaseTestTimeoutMs },
  () => {
    layer(Layer.mergeAll(AuthorAppLayer, NodeServices.layer), {
      excludeTestServices: true,
    })("the MathML fixtures through the importer", (it) => {
      for (const { name, rule } of mathmlNegatives) {
        it.effect(`refuses ${name} under ${rule}`, () =>
          // Oracle: PostgreSQL, every law of the schema over the whole package. The importer
          // names the first object PostgreSQL refuses, so where the law oracle names several
          // breaches the importer's rule is one of theirs; where it names exactly one, the
          // importer's rule is the entry's.
          Effect.gen(function* refused() {
            const dir = yield* materializeMathml(name);
            const judgment = yield* judge(yield* readEntries(dir), grammar, laws);
            const rules = new Set<string>(
              judgment._tag === "CodecRefusal"
                ? [judgment.rule]
                : judgment.breaches.map(({ law }) => ruleOf(law)),
            );
            const failure = yield* Effect.flip(importDir(dir));

            assert.instanceOf(failure, ImportRefused);

            const given = failure instanceof ImportRefused ? failure.rules[0] : undefined;

            if (rules.size > 1) {
              assert.isTrue(
                given !== undefined && rules.has(given),
                `${name}: the importer's ${given}, the oracle's ${[...rules].join(", ")}`,
              );
            } else {
              assert.strictEqual(given, rule, `${name}: the oracle's ${[...rules].join(", ")}`);
            }
          }),
        );
      }

      for (const { name } of mathmlPositives) {
        it.effect(`imports ${name} and exports it equal to its record`, () =>
          // Oracle: PostgreSQL accepts the package whole, and the exporter's account of the
          // stored `Entry` family equals the entries it was imported from.
          Effect.gen(function* roundTrips() {
            const id = yield* importDir(yield* materializeMathml(name));
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

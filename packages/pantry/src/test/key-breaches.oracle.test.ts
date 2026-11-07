/**
 * The keys PostgreSQL checks as a statement writes its rows, evaluated on the host over every
 * packaging fixture the import reads (`key-breaches.ts`), held to the law oracle's verdict on the
 * same package: a key the import's rows break is a law the oracle breaks, so the database never
 * refuses a package under a key the oracle does not predict (the DB tier's extmeta-item-href and
 * rtest01-cycle, which the oracle had judged under other laws).
 *
 * Oracle: two implementations side by side, the law oracle's breaches and the schema's own key
 * statements over the import's rows; neither computes the other's verdict.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, Result } from "effect";
import { composed } from "#pantry/grammar/compose.ts";
import { readProgram } from "#pantry/import/program.ts";
import { readPackage } from "#pantry/package/read.ts";
import { materialize } from "#pantry/test/fixtures.ts";
import { evaluatedKeys, keyBreachesOf } from "#pantry/test/key-breaches.ts";
import { packagingFixtures } from "#pantry/test/locate.ts";
import { judge, lawsOf } from "#pantry/test/oracle.ts";

/**
 * The timeout, in milliseconds, that this file's slower tests state, each itself or through its
 * describe: a hang guard, never a budget. Measured 2026-11-07: 137.3 s at a load average of 75,
 * under V8 coverage, its slowest test.
 */
const testTimeoutMs = 600_000;

/**
 * The composed grammar every package is judged by.
 */
const grammar = Result.getOrThrow(composed());

/**
 * The tables the laws read, derived from {@link grammar} once.
 */
const laws = lawsOf(grammar);

/**
 * The keys the box must read somewhere, each a key a refusal of the DB tier named: a document per
 * path, a binding per response, a hottext per identifier, and an id per document, each over its
 * assembly where one places a fragment.
 */
const requiredKeys = [
  "Document(package, path)",
  "IdBinding(document, id)",
  "PlacedBinding(assembly, identifier)",
  "PlacedHottext(assembly, identifier)",
] as const;

layer(NodeServices.layer, { excludeTestServices: true })(
  "test/key-breaches.ts, the keys the import's rows break, judged by the law oracle",
  (it) => {
    it.effect(
      "breaks a key only where the oracle breaks the key's law, over every packaging fixture",
      () =>
        // Oracle: the law oracle's breaches of each package. Bound: every packaging fixture the
        // spec's 4.12 to 4.14 name, positives and hand-broken copies.
        Effect.gen(function* keysAgree() {
          const read = new Set<string>();
          for (const name of packagingFixtures) {
            const dir = yield* materialize(name);
            const judgment = yield* judge(yield* readPackage(dir), grammar, laws);
            const program = yield* Effect.result(readProgram(dir));
            if (Result.isFailure(program)) {
              assert.strictEqual(judgment._tag, "CodecRefusal", `${name}: the reader refused it`);
              continue;
            }

            for (const key of evaluatedKeys(program.success.inputs)) {
              read.add(`${key.relation}(${key.fields.join(", ")})`);
            }

            const oracle = new Set<string>(
              judgment._tag === "Judged" ? judgment.breaches.map(({ law }) => law) : [],
            );

            assert.deepStrictEqual(
              keyBreachesOf(program.success.inputs)
                .filter(({ law }) => !oracle.has(law))
                .map(
                  ({ fields, key, law, relation }) =>
                    `${law}: ${relation}(${fields.join(", ")}) ${key}`,
                ),
              [],
              `${name}: keys the oracle does not predict`,
            );
          }

          assert.deepStrictEqual(
            requiredKeys.filter((key) => !read.has(key)),
            [],
            "keys no fixture let the box read",
          );
        }),
      testTimeoutMs,
    );
  },
);

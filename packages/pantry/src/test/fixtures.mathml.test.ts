import { existsSync } from "node:fs";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, Result } from "effect";
import { readRows } from "#pantry/import/package.ts";
import { examplesTarball, fixtureNames, materialize } from "#pantry/test/fixtures.ts";
import type { FixtureName } from "#pantry/test/fixtures.ts";

/**
 * Whether the examples tarball, which every cut positive is cut from, is on this machine.
 */
const tarballPresent = existsSync(Effect.runSync(examplesTarball));

/**
 * The 12 cut MathML positives of spec 4.11's first table, in the table's order.
 */
const positives = [
  "math-mathml",
  "math-stat2",
  "math-calc5",
  "math-solution",
  "math-template-block",
  "math-alttext",
  "math-polynomials",
  "math-order",
  "math-associate",
  "math-either-or",
  "math-inline-choice",
  "math-class",
] as const satisfies readonly FixtureName[];

layer(NodeServices.layer, { excludeTestServices: true })(
  "test/fixtures.ts cut MathML positives",
  (it) => {
    it.effect("registers the 12 positives under distinct names", () =>
      Effect.sync(() => {
        assert.strictEqual(new Set(positives).size, positives.length);

        for (const name of positives) {
          assert.include(fixtureNames, name);
        }
      }),
    );

    for (const name of positives) {
      it.effect.skipIf(!tarballPresent)(
        `${name} materializes and readRows succeeds (skipped without the examples tarball)`,
        () =>
          Effect.gen(function* readsPositive() {
            const dir = yield* materialize(name);
            const result = yield* Effect.result(readRows(dir));

            if (Result.isFailure(result)) {
              assert.fail(`${name} was refused: ${result.failure.message}`);
            }
          }),
      );
    }
  },
);

/**
 * The import's read of the packaging fixtures, on the host: the reader and the codec refuse
 * exactly the packages the law oracle's reader and codec refuse, under the same rule, and read
 * every other one, so every refusal past them is the database's.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import type { PlatformError } from "effect";
import { inject } from "vitest";
import { readProgram } from "#pantry/import/program.ts";
import { readEntries } from "#pantry/package/read.ts";
import { materialize, materializePackage } from "#pantry/test/fixtures.ts";
import type { FixtureName } from "#pantry/test/fixtures.ts";
import { oracleCodecRule, packagingFixtures } from "#pantry/test/oracle-verdict.ts";
import { ImportRefused } from "#pantry/import/rules.ts";

const fixtures = inject("fixtures");

/**
 * Name the rule a read failed under: a refusal's own, the one rule a refusal made before the
 * database carries, written as the verdict file writes a refusal's rules, or the platform
 * failure's tag, which no refusal names.
 *
 * @param failure - The read's failure.
 * @returns Its rule.
 */
const ruleOf = (failure: ImportRefused | PlatformError.PlatformError): string =>
  failure instanceof ImportRefused ? failure.rules.join("|") : failure._tag;

layer(NodeServices.layer, { excludeTestServices: true })(
  "readProgram over the packaging fixtures",
  (suite) => {
    suite.effect("refuses exactly what the oracle's codec refuses, under its rule", () =>
      // Oracle: a second implementation, the law oracle's own read of the same entries (`judge`'s
      // reader, version and shred), over every packaging fixture and the published packages.
      Effect.gen(function* codecAgrees() {
        const dirs: readonly (readonly [string, string])[] = [
          ...(yield* Effect.all(
            packagingFixtures.map((name: FixtureName) =>
              Effect.map(materialize(name), (dir) => [name, dir] as const),
            ),
          )),
          ["simple", fixtures.simple],
          ["lti", fixtures.lti],
          ["metaData", fixtures.metaData],
          ["CAT_Test01_Adaptive_EchoAdapt", fixtures.CAT_Test01_Adaptive_EchoAdapt],
          ["sample_pci", fixtures.sample_pci],
          ["usageData", yield* materializePackage("usageData")],
        ];
        for (const [name, dir] of dirs) {
          const expected = yield* oracleCodecRule(yield* readEntries(dir));
          const read = yield* Effect.result(readProgram(dir));

          assert.deepStrictEqual(
            Result.isFailure(read) ? Option.some(ruleOf(read.failure)) : Option.none(),
            expected,
            name,
          );
        }
      }),
    );
  },
);

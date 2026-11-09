/**
 * A response rules fragment an item includes is typed in that item (spec reading 117), PostgreSQL
 * the judge: a variable reference that is a whole condition names a boolean single declaration of
 * the item ("Condition type", P21), which the schema states as a rule over the
 * `PlacedReferenceType` query (`#pantry/qti/queries.ts`), so only the database judges an included
 * one. The oracle's side, and the import's rows on the host, are
 * `#pantry/qti/placed-types.oracle.test.ts`; genetic repair round 4's inventory (research aeced65a,
 * class O38) found the import accepting the included identifier condition.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, Layer } from "effect";
import { describe } from "vitest";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import { importPackage } from "#pantry/import/package.ts";
import { ImportRefused } from "#pantry/import/rules.ts";
import type { PackageEntries } from "#pantry/test/gen/every-relation.ts";
import { writePackage } from "#pantry/test/gen/every-relation.ts";
import { bare, includingOf, inlineOf, matched } from "#pantry/test/placed-types.ts";
import { scratchDirectory } from "#pantry/test/scratch.ts";
import { authorLayerHookTimeoutMs, hasLease, leaseTestTimeoutMs } from "#pantry/test/settings.ts";

/**
 * One case: what it is, the package, and whether the database refuses it under "Condition type"'s
 * rule.
 */
interface Case {
  readonly entries: PackageEntries;
  readonly name: string;
  readonly refused: boolean;
}

/**
 * The included identifier condition (`V-O38-include-nonboolean-condition`), the inline one
 * (`V-O38-inline-nonboolean-condition`) and the included match (`V-control-include-good`).
 */
const cases: readonly Case[] = [
  {
    entries: includingOf("", bare),
    name: "an included condition that is an identifier response",
    refused: true,
  },
  {
    entries: inlineOf(bare),
    name: "an inline condition that is an identifier response",
    refused: true,
  },
  {
    entries: includingOf("", matched),
    name: "an included condition that matches a response with its correct value",
    refused: false,
  },
];

describe.skipIf(!hasLease)(
  "import/placed-types.db.test.ts, on the lease",
  { timeout: leaseTestTimeoutMs },
  () => {
    layer(Layer.mergeAll(AuthorAppLayer, NodeServices.layer), {
      excludeTestServices: true,
      timeout: authorLayerHookTimeoutMs,
    })("a condition in a response rules fragment", (it) => {
      for (const { entries, name, refused } of cases) {
        it.effect(`${refused ? "refuses" : "accepts"} ${name}`, () =>
          // Oracle: PostgreSQL, every law of the schema over the case's package; the expected
          // verdict is the case's as written (spec reading 117, P21).
          Effect.scoped(
            Effect.gen(function* placedConditionVerdict() {
              const dir = yield* scratchDirectory("placed-types-");
              yield* writePackage(entries, dir);

              const outcome = yield* Effect.result(importPackage(dir));

              if (refused) {
                assert.isTrue(
                  outcome._tag === "Failure" &&
                    outcome.failure instanceof ImportRefused &&
                    outcome.failure.rules.includes("P21"),
                  `${name}: ${outcome._tag === "Failure" ? outcome.failure.message : "accepted"}`,
                );
              } else {
                assert.strictEqual(
                  outcome._tag,
                  "Success",
                  `${name}: ${outcome._tag === "Failure" ? outcome.failure.message : "accepted"}`,
                );
              }
            }),
          ),
        );
      }
    });
  },
);

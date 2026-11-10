/**
 * A usage statistic's `lastUpdated` through the import on the lease, PostgreSQL the judge: a date
 * outside xs:date's lexical space, the month lengths and the leap rule included, is refused under
 * `attribute-lexical`, whichever of its two statements PostgreSQL checks first (the attribute's
 * value domain, or `StatisticDate.day`'s `lexical(date)` as the statement casts it), and a day is
 * accepted (the orchestrator's ruling of 2026-11-06: one law, one rule). The oracle's side is
 * `test/statistic-dates.oracle.test.ts`.
 */
import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, FileSystem, Layer } from "effect";
import { describe } from "vitest";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import { importPackage } from "#pantry/import/package.ts";
import { readPackage } from "#pantry/package/read.ts";
import { materialize } from "#pantry/test/fixtures.ts";
import { scratchDirectory } from "#pantry/test/scratch.ts";
import { hasLease, leaseTestTimeoutMs } from "#pantry/test/settings.ts";
import { ImportRefused } from "#pantry/import/rules.ts";

/**
 * The text `usage3`'s first statistic writes, which each case replaces.
 */
const firstLastUpdated = 'lastUpdated="2004-07-04"';

/**
 * The dates the ruling names, each with whether it names a day: a leap day of a leap year and of a
 * leap century, the 29th of February of a common year and of a common century, a 30th of February,
 * the last day of a 30-day month and its 31st, a month 13, a day 00, and the year 0000.
 */
const dates = [
  ["2004-02-29", true],
  ["2000-02-29", true],
  ["2003-02-29", false],
  ["1900-02-29", false],
  ["2004-02-30", false],
  ["2004-04-30", true],
  ["2004-04-31", false],
  ["2004-13-04", false],
  ["2004-01-00", false],
  ["0000-01-01", false],
] as const;

describe.skipIf(!hasLease)(
  "import/statistic-dates.db.test.ts, on the lease",
  { timeout: leaseTestTimeoutMs },
  () => {
    layer(Layer.mergeAll(AuthorAppLayer, NodeServices.layer), {
      excludeTestServices: true,
    })("a usage statistic's lastUpdated, refused under one rule", (it) => {
      for (const [lexical, day] of dates) {
        it.effect(`${day ? "accepts" : "refuses"} lastUpdated ${lexical}`, () =>
          // Oracle: PostgreSQL, every law of the schema over `usage3` with its first statistic's
          // lastUpdated edited; the expected verdict is the Gregorian calendar's, written by hand.
          Effect.scoped(
            Effect.gen(function* dateVerdict() {
              const fs = yield* FileSystem.FileSystem;
              const dir = yield* scratchDirectory("statistic-dates-");
              for (const file of yield* readPackage(yield* materialize("usage3"))) {
                const text = new TextDecoder().decode(file.bytes);
                yield* fs.makeDirectory(path.dirname(`${dir}/${file.path}`), { recursive: true });
                yield* fs.writeFile(
                  `${dir}/${file.path}`,
                  file.path === "example.xml"
                    ? new TextEncoder().encode(
                        text.replace(firstLastUpdated, `lastUpdated="${lexical}"`),
                      )
                    : file.bytes,
                );
              }

              const outcome = yield* Effect.result(importPackage(dir));

              if (day) {
                assert.strictEqual(outcome._tag, "Success", lexical);
              } else {
                assert.isTrue(
                  outcome._tag === "Failure" &&
                    outcome.failure instanceof ImportRefused &&
                    outcome.failure.rules.includes("attribute-lexical"),
                  `${lexical}: ${outcome._tag === "Failure" ? outcome.failure.message : "accepted"}`,
                );
              }
            }),
          ),
        );
      }
    });
  },
);

/**
 * A usage statistic's `lastUpdated`, a `DateDType`, judged by the law oracle and named by the
 * importer's law table: one law, the attribute's value domain, refuses a date outside xs:date's
 * lexical space, the month lengths and the leap rule included (XML Schema 1.1 Part 2 §3.3.9,
 * Day-of-month Representations), and the database's restatement of it on `StatisticDate.day` is
 * that law under its rule, `attribute-lexical` (the orchestrator's ruling of 2026-11-06). The
 * database's side is `import/statistic-dates.db.test.ts`.
 *
 * Oracle: the platform's proleptic Gregorian calendar (`Date`), which says whether a year, month
 * and day name a day, so no expected verdict is computed by the domain compiler or the oracle.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { element } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { lexical, date } from "@bjornpagen/grizzle";
import { Array as Arr, Duration, Effect, Equivalence, Option, Result } from "effect";
import { composed } from "#pantry/grammar/compose.ts";
import { lawTable, precedence } from "#pantry/vocab/laws.ts";
import { readPackage } from "#pantry/package/read.ts";
import type { PackageFile } from "#pantry/package/read.ts";
import { materialize } from "#pantry/test/fixtures.ts";
import { judge, lawsOf, verdictOf } from "#pantry/test/oracle.ts";
import { schemaLawNameOf, statedLaws } from "#pantry/test/law-namer.ts";

/**
 * The timeout, in milliseconds, that this file's slower tests state, each itself or through its
 * describe: a hang guard, never a budget. Measured 2026-11-07: 122.4 s at a load average of 75,
 * under V8 coverage, its slowest test.
 */
const testTimeoutMs = 300_000;

/**
 * The composed grammar every case is judged by.
 */
const grammar = Result.getOrThrow(composed());

/**
 * The tables the laws read, derived from {@link grammar} once.
 */
const laws = lawsOf(grammar);

/**
 * The years of the box: the year 0000 xs:date has none of, the first and the last, a common and a
 * leap century, a common and a leap year.
 */
const years = ["0000", "0001", "1900", "2000", "2003", "2004", "9999"] as const;

/**
 * The months and days of the box: a first and a last day, a day 00 and a month 00, the last day of
 * February in a common year, a leap day, a 30th of February, the last day of a 30-day month and its
 * 31st, and a month 13.
 */
const monthDays = [
  "01-01",
  "12-31",
  "01-00",
  "00-01",
  "02-28",
  "02-29",
  "02-30",
  "04-30",
  "04-31",
  "13-04",
] as const;

/**
 * The whitespace around a date: none, and the spaces and tabs xs:date's `collapse` admits.
 */
const spacings = [
  ["", ""],
  [" ", "\t"],
] as const;

/**
 * One `lastUpdated` of the box.
 */
interface DateCase {
  readonly monthDay: (typeof monthDays)[number];
  readonly spacing: (typeof spacings)[number];
  readonly year: (typeof years)[number];
}

/**
 * Every `lastUpdated` of the box: each year by each month and day by each spacing, 140.
 */
const dateCases: Gen<DateCase> = (source) => ({
  monthDay: source.draw(element(monthDays)),
  spacing: source.draw(element(spacings)),
  year: source.draw(element(years)),
});

/**
 * Write a case's `lastUpdated` as its attribute holds it.
 *
 * @param drawn - The case.
 * @returns The lexical form.
 */
const lexicalOf = (drawn: DateCase): string =>
  `${drawn.spacing[0]}${drawn.year}-${drawn.monthDay}${drawn.spacing[1]}`;

/**
 * Decide whether a case names a day, by the platform's proleptic Gregorian calendar: the year
 * written as four digits, from 0001 (xs:date has no year 0000), and the month and day the ones the
 * calendar keeps once it sets them.
 *
 * @param drawn - The case.
 * @returns Whether it names a day.
 */
const namesDay = (drawn: DateCase): boolean => {
  const [year, month, day] = [drawn.year, ...drawn.monthDay.split("-")].map(Number);
  if (year === undefined || month === undefined || day === undefined || year < 1) {
    return false;
  }

  const at = new Date(0);
  at.setUTCFullYear(year, month - 1, day);

  return at.getUTCFullYear() === year && at.getUTCMonth() === month - 1 && at.getUTCDate() === day;
};

/**
 * The text `usage3`'s first statistic writes, which each case replaces.
 */
const firstLastUpdated = 'lastUpdated="2004-07-04"';

/**
 * Write `usage3` with its first statistic's `lastUpdated` replaced by a case's.
 *
 * @param files - `usage3`'s entries.
 * @param drawn - The case.
 * @returns The entries.
 */
const packageOf = (files: readonly PackageFile[], drawn: DateCase): readonly PackageFile[] =>
  files.map((file) => {
    if (file.path !== "example.xml") {
      return file;
    }

    const text = new TextDecoder().decode(file.bytes);
    assert.include(text, firstLastUpdated);

    return {
      ...file,
      bytes: new TextEncoder().encode(
        text.replace(firstLastUpdated, `lastUpdated="${lexicalOf(drawn)}"`),
      ),
    };
  });

/**
 * A situation the box must reach.
 */
type DateSituation =
  | "a day"
  | "a leap day"
  | "the 29th of February of a common year"
  | "the 30th of February"
  | "the 31st of a 30-day month"
  | "month 13"
  | "day 00"
  | "the year 0000";

/**
 * The situations a case reaches.
 *
 * @param drawn - The case.
 * @returns Its situations.
 */
const situationsOf = (drawn: DateCase): readonly DateSituation[] => [
  ...(namesDay(drawn) ? (["a day"] as const) : []),
  ...(drawn.monthDay === "02-29"
    ? [
        namesDay(drawn)
          ? ("a leap day" as const)
          : ("the 29th of February of a common year" as const),
      ]
    : []),
  ...(drawn.monthDay === "02-30" ? (["the 30th of February"] as const) : []),
  ...(drawn.monthDay === "04-31" ? (["the 31st of a 30-day month"] as const) : []),
  ...(drawn.monthDay === "13-04" ? (["month 13"] as const) : []),
  ...(drawn.monthDay === "01-00" ? (["day 00"] as const) : []),
  ...(drawn.year === "0000" ? (["the year 0000"] as const) : []),
];

layer(NodeServices.layer, { excludeTestServices: true })(
  "a usage statistic's lastUpdated, one law and one rule",
  (it) => {
    it.effect(
      "the oracle breaks the value domain alone, exactly where the date names no day, and names attribute-lexical",
      (ctx) =>
        // Oracle: the platform's Gregorian calendar (`namesDay`). Bound: 7 years by 10 months and
        // days by 2 spacings, 140 packages of `usage3`.
        Effect.gen(function* oracleBox() {
          const files = yield* readPackage(yield* materialize("usage3"));

          return yield* searched(
            ctx,
            exhaust(
              {
                box: "usage3 with its first lastUpdated each of 7 years by 10 months and days, bare or between a space and a tab",
                caseHang: Duration.seconds(30),
                coverage: requiredInSpace<DateSituation>([
                  "a day",
                  "a leap day",
                  "the 29th of February of a common year",
                  "the 30th of February",
                  "the 31st of a 30-day month",
                  "month 13",
                  "day 00",
                  "the year 0000",
                ]),
                generator: dateCases,
                limit: 200,
                literal: (drawn) => JSON.stringify(lexicalOf(drawn)),
                oracle: {
                  kind: "specification",
                  name: "the proleptic Gregorian calendar of XML Schema 1.1 Part 2 §3.3.9's day-of-month constraints",
                },
                suite: "test/statistic-dates",
              },
              (drawn: DateCase, c) =>
                Effect.gen(function* dateCase() {
                  for (const situation of situationsOf(drawn)) {
                    c.note(situation);
                  }

                  const day = namesDay(drawn);
                  const judgment = yield* judge(packageOf(files, drawn), grammar, laws);

                  assert.deepStrictEqual(
                    judgment._tag === "Judged"
                      ? [...new Set(judgment.breaches.map(({ law }) => law))]
                      : judgment,
                    day ? [] : ["value domain"],
                    JSON.stringify(lexicalOf(drawn)),
                  );
                  assert.deepStrictEqual(
                    verdictOf(judgment),
                    day
                      ? { verdict: "accepted" }
                      : { rule: "attribute-lexical", verdict: "refused" },
                    JSON.stringify(lexicalOf(drawn)),
                  );
                }),
            ),
          );
        }),
      testTimeoutMs,
    );

    it.effect(
      "names every law the database states over a statistic's day the value domain, under attribute-lexical, and no rule calendar",
      () =>
        Effect.sync(() => {
          // Oracle: the ruling's one law: lexical(date)'s pattern law, which refuses a day as its
          // statement casts it into `StatisticDate.day`, and `StatisticDate.date`'s generated law are
          // the value domain, and no law of the table, and no place in the precedence, is a calendar's.
          const day = lexical(date).patterns.map(({ source }) => source);
          const dayLaws = statedLaws().filter(
            ([law]) =>
              (law.kind === "pattern" &&
                Equivalence.Array(Equivalence.String)(
                  law.patterns.map(({ source }) => source),
                  day,
                )) ||
              (law.kind === "generated" && law.relation === "StatisticDate"),
          );

          assert.lengthOf(dayLaws, 2);
          for (const [law] of dayLaws) {
            assert.deepStrictEqual(schemaLawNameOf(law), Option.some("value domain"), law.kind);
          }

          assert.strictEqual(lawTable["value domain"].rule, "attribute-lexical");
          assert.deepStrictEqual(
            Arr.filter(Object.values(lawTable), ({ rule }) => rule.includes("calendar")),
            [],
          );
          assert.notInclude([...precedence].map(String), "calendar");
        }),
    );
  },
);

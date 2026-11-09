/**
 * A response rules fragment an item includes is typed in that item (spec reading 117: "the content
 * of the fragment must satisfy the requirements of the specification in the context of the item in
 * which it is being included"), on the import's rows as in the law oracle. A reference in an
 * included fragment names its variable in the fragment's own document, where nothing is declared,
 * so its resolution in the item is a `PlacedVariableRefDeclaration`. "Mapped response" holds a map
 * response's row to its declaration's mapping, as it holds an item's own reference (information
 * model §7.22, spec reading 166), and "Condition type" holds a variable reference that is a whole
 * condition to its declaration's type, boolean single, through the `PlacedReferenceType` query
 * (P21, `#pantry/qti/queries.ts`). Genetic repair round 4's inventory (research aeced65a, classes
 * O18 and O38) found the import accepting both where the oracle, which types the fragment in its
 * assembly, raises the law. A rule over a query is the database's alone (the host leaves it
 * unknown, `#pantry/test/gen/genetic/host-laws.ts`), so the included condition breaks "Condition
 * type" in the oracle and on PostgreSQL (`#pantry/import/placed-types.db.test.ts`), and the
 * import's rows on the host name no law of it.
 *
 * Oracle: a second implementation, the law oracle (`#pantry/test/oracle.ts` `judge`), against the
 * laws the import's rows break on the host (`#pantry/test/gen/genetic/judge.ts` `judgeOne`).
 *
 * Bound: one item whose response, an identifier, declares no mapping. Its response processing tests
 * a map response of it, written in an included fragment, then the controls: the same rule written
 * inline, and the included one over a response that declares a mapping. Then it tests the response
 * itself as a condition, included and inline, and the control, an included match of the response
 * with its correct value. 6 cases, exhausted. Each of the first two breaks "Mapped response" on
 * both sides, and the third on neither; the included condition breaks "Condition type" in the
 * oracle, the database's alone on the import's side, and the inline one on both sides; and the last
 * is accepted on both.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { noCoverage } from "@grizzle/testing/features";
import { int } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect } from "effect";
import { grammar } from "#pantry/grammar/install.ts";
import type { PackageEntries } from "#pantry/test/gen/every-relation.ts";
import { genomeOf } from "#pantry/test/gen/genetic/genome.ts";
import { judgeOne, shownDisagreement } from "#pantry/test/gen/genetic/judge.ts";
import { lawsOf } from "#pantry/test/oracle.ts";
import {
  bare,
  includingOf,
  inlineOf,
  mapped,
  mapping,
  matched,
} from "#pantry/test/placed-types.ts";
import { scratchDirectory } from "#pantry/test/scratch.ts";

/**
 * The timeout, in milliseconds, that this file's test states: a hang guard, never a budget.
 * Measured 2026-11-09: 0.2 s at a load average of 68 to 127, its one test alone.
 */
const testTimeoutMs = 600_000;

/**
 * The oracle's law tables over the composed grammar.
 */
const laws = lawsOf(grammar);

/**
 * One case: what it is, the package, the law it is about, and what both sides say of it: each
 * breaks the law, neither does, both accept the package, or the oracle breaks the law where the
 * import's side states it only as a rule over a query, which the host leaves to the database
 * (`database`).
 */
interface Case {
  readonly entries: PackageEntries;
  readonly expected: "accepted" | "breaks" | "database" | "holds";
  readonly law: "Condition type" | "Mapped response";
  readonly name: string;
}

/**
 * Every case of the bound: the included map response with no mapping (research aeced65a's
 * `V-O18-include-map-response-no-mapping`), then its controls, the inline one
 * (`V-O18-inline-map-response-no-mapping`) and the included one with a mapping; the included
 * identifier condition (`V-O38-include-nonboolean-condition`), then its controls, the inline one
 * (`V-O38-inline-nonboolean-condition`) and the included match (`V-control-include-good`).
 */
const cases: readonly Case[] = [
  {
    entries: includingOf("", mapped),
    expected: "breaks",
    law: "Mapped response",
    name: "an included map response of a response with no mapping",
  },
  {
    entries: inlineOf(mapped),
    expected: "breaks",
    law: "Mapped response",
    name: "an inline map response of a response with no mapping",
  },
  {
    entries: includingOf(mapping, mapped),
    expected: "holds",
    law: "Mapped response",
    name: "an included map response of a response with a mapping",
  },
  {
    entries: includingOf("", bare),
    expected: "database",
    law: "Condition type",
    name: "an included condition that is an identifier response",
  },
  {
    entries: inlineOf(bare),
    expected: "breaks",
    law: "Condition type",
    name: "an inline condition that is an identifier response",
  },
  {
    entries: includingOf("", matched),
    expected: "accepted",
    law: "Condition type",
    name: "an included condition that matches a response with its correct value",
  },
];

/**
 * A law's name as a whole word of a summary.
 *
 * @param law - The law.
 * @returns The pattern.
 */
const lawPattern = (law: Case["law"]): RegExp => new RegExp(`\\b${law}\\b`, "u");

layer(NodeServices.layer, { excludeTestServices: true })(
  "a reference in an included rules fragment",
  (it) => {
    it.effect(
      "is typed by its item's declaration, on the import's rows as in the law oracle",
      (ctx) =>
        searched(
          ctx,
          Effect.gen(function* placedTypesRuns() {
            const directory = yield* scratchDirectory("placed-types-");
            const bench = { directory, grammar, laws };

            assert.strictEqual(cases.length, 6);

            return yield* exhaust(
              {
                box: "the 6 placed type cases: a map response of a response with no mapping, included and inline, and an included one of a response with a mapping; an identifier response as a condition, included and inline, and an included match of it with its correct value",
                caseHang: Duration.minutes(5),
                coverage: noCoverage,
                generator: int(0, cases.length - 1),
                limit: cases.length,
                literal: (at) => cases[at]?.name ?? String(at),
                oracle: {
                  kind: "second-implementation",
                  name: "the law oracle against the laws the import's rows break on the host",
                },
                suite: "pantry/placed-types",
              },
              (at) =>
                Effect.gen(function* placedTypesCase() {
                  const of = cases[at];
                  assert.isDefined(of, `no case ${String(at)}`);
                  if (of === undefined) {
                    return;
                  }

                  const judged = yield* judgeOne(yield* genomeOf(of.entries), bench, at);
                  const said = `${of.name}: the oracle ${judged.summary.oracle}; the import ${judged.summary.import}`;
                  if (of.expected === "accepted") {
                    // Neither side breaks a law: the oracle judges no breach, the import builds
                    // with none.
                    assert.deepStrictEqual(judged.disagreements.map(shownDisagreement), [], said);
                    assert.strictEqual(judged.summary.oracle, "laws ", said);
                    assert.strictEqual(judged.summary.import, "built ", said);

                    return;
                  }

                  const apart = judged.disagreements.filter(
                    (disagreement) =>
                      (disagreement.kind === "oracle-only-law" ||
                        disagreement.kind === "import-only-law") &&
                      disagreement.law === of.law,
                  );
                  const pattern = lawPattern(of.law);

                  assert.deepStrictEqual(apart.map(shownDisagreement), [], said);
                  if (of.expected === "holds") {
                    assert.notMatch(judged.summary.oracle, pattern, said);
                    assert.notMatch(judged.summary.import, pattern, said);
                  } else if (of.expected === "database") {
                    // The import's side states the law over a query, which the host never judges:
                    // its rows break no law of it there, and the database refuses the package.
                    assert.match(judged.summary.oracle, pattern, said);
                    assert.notMatch(judged.summary.import, pattern, said);
                  } else {
                    assert.match(judged.summary.oracle, pattern, said);
                    assert.match(judged.summary.import, pattern, said);
                  }
                }),
            );
          }).pipe(Effect.scoped),
        ),
      testTimeoutMs,
    );
  },
);

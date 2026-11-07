/**
 * The genetic differential: a feature-guided genetic search for every disagreement between the
 * law oracle (`#pantry/test/oracle.ts`, the independent implementation) and the import's host path
 * (`#pantry/import/program.ts` `readProgram`: its refusal, or the rows it builds, held to the laws
 * the schema states on the host), with no database (`#pantry/test/gen/genetic/`).
 *
 * Each case is one run of the genetic loop: its swarm over the edit operators and its seed are the
 * case's draw, so its replay token replays the run. A run judges seeds drawn from the corpus (the
 * every-relation package, R87's assembly packages and the packaging fixtures), then breeds
 * candidates from parents picked by novelty over the features both sides show (law × element kind
 * × document root on the oracle's side, rule × stage on the import's), each by structural edits,
 * crossover and named faults. Every class of disagreement it meets is reduced to its smallest
 * package and reported, all of them in one failure.
 *
 * The bounded budget runs here; `GR8DES_GENETIC=1` runs the long one. After the last run, the
 * Good–Turing residual of each feature family over the rotating runs is printed: residual risk of
 * the generator and its features, never proof.
 *
 * The planted value-domain cases (`#pantry/test/gen/genetic/planted.ts`) are judged every run on
 * their own: each value lies inside its domain's lexical space and outside its facets, which the
 * oracle refuses and today's database does not, so the two must agree on each.
 */
import { NodeServices } from "@effect/platform-node";
import { afterAll, assert, layer } from "@effect/vitest";
import { drawn, exhaust, explore } from "@grizzle/testing/explore";
import { noCoverage } from "@grizzle/testing/features";
import { int } from "@grizzle/testing/gen";
import { boundedShrink } from "@grizzle/testing/shrink";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, Option } from "effect";
import { grammar } from "#pantry/grammar/install.ts";
import { lawTable } from "#pantry/import/refusal.ts";
import { corpusOf } from "#pantry/test/gen/genetic/corpus.ts";
import { residualsOf } from "#pantry/test/gen/genetic/engine.ts";
import type { Budget } from "#pantry/test/gen/genetic/engine.ts";
import { genomeOf } from "#pantry/test/gen/genetic/genome.ts";
import { familyOf, judgeOne, shownDisagreement } from "#pantry/test/gen/genetic/judge.ts";
import { plantedCases } from "#pantry/test/gen/genetic/planted.ts";
import type { Feature } from "#pantry/test/gen/genetic/judge.ts";
import {
  hunt,
  runLiteral,
  runSketch,
  shownReport,
  shownResidual,
} from "#pantry/test/gen/genetic/search.ts";
import { lawsOf } from "#pantry/test/oracle.ts";
import { scratchDirectory } from "#pantry/test/scratch.ts";
import { settings } from "#pantry/test/settings.ts";

/**
 * The oracle's law tables over the installed grammar, which the importer reads.
 */
const laws = lawsOf(grammar);

/**
 * The two budgets: the bounded one the free suite runs, and the long one `GR8DES_GENETIC=1` asks
 * for. `runs` is the rotating stream's runs (the floor stream runs a quarter as many), `budget`
 * each run's, and `tries` each reduction's.
 */
const budgets = {
  bounded: {
    budget: { candidates: 80, edits: 3, generation: 1, initial: 6 },
    runs: 2,
    tries: 120,
  },
  long: {
    budget: { candidates: 600, edits: 4, generation: 1, initial: 12 },
    runs: 8,
    tries: 400,
  },
} as const satisfies Readonly<
  Record<string, { readonly budget: Budget; readonly runs: number; readonly tries: number }>
>;

/**
 * The budget this run takes.
 */
const chosen = settings.geneticRequested ? budgets.long : budgets.bounded;

/**
 * Each feature over the rotating runs, with the runs that showed it, for the residual printed after
 * the last run.
 */
const acrossRuns = new Map<Feature, number>();

/**
 * The rotating runs counted into {@link acrossRuns}.
 */
let rotatingRuns = 0;

/**
 * Each law the oracle raised in any run, with the candidates that raised it, whether one raised it
 * alone, and the laws every candidate that raised it raised beside it.
 */
const isolation = {
  alone: new Set<string>(),
  beside: new Map<string, ReadonlySet<string>>(),
  raised: new Map<string, number>(),
};

afterAll(() => {
  const never = Object.keys(lawTable).filter((law) => !isolation.raised.has(law));
  const together = [...isolation.raised.keys()]
    .filter((law) => !isolation.alone.has(law))
    .map(
      (law) =>
        `${law} (${String(isolation.raised.get(law) ?? 0)} raised, always beside ${[...(isolation.beside.get(law) ?? [])].join(", ") || "no one law"})`,
    );
  console.log(
    `genetic differential, laws broken alone: ${String(isolation.alone.size)} of ${String(Object.keys(lawTable).length)} stated\nraised, never alone: ${together.join("; ") || "none"}\nnever raised: ${never.join(", ") || "none"}`,
  );
});

afterAll(() => {
  const lines = residualsOf(acrossRuns, rotatingRuns, familyOf).map(
    ({ estimate, family, observed, singletons }) =>
      `${family}: ${String(singletons)} of ${String(observed)} features in one run of ${String(rotatingRuns)}, Good–Turing ${estimate.toFixed(3)}`,
  );
  console.log(`genetic differential, residual risk over the rotating runs:\n${lines.join("\n")}`);
});

layer(NodeServices.layer, { excludeTestServices: true })(
  "the genetic differential of the import's host path and the law oracle",
  (it) => {
    it.effect(
      "agrees on every planted value outside its domain's facets",
      (ctx) =>
        // Oracle: a second implementation, the law oracle, against the laws the import's rows hold
        // on the host. Bound: the three planted cases, each judged once.
        searched(
          ctx,
          Effect.gen(function* plantedRuns() {
            const directory = yield* scratchDirectory("genetic-planted-");
            const bench = { directory, grammar, laws };

            return yield* exhaust(
              {
                box: "the three planted values outside their domain's facets",
                caseHang: Duration.minutes(5),
                coverage: noCoverage,
                generator: int(0, plantedCases.length - 1),
                limit: plantedCases.length,
                literal: (at) => plantedCases[at]?.name ?? String(at),
                oracle: {
                  kind: "second-implementation",
                  name: "the law oracle against the laws the import's rows hold on the host",
                },
                suite: "pantry/genetic-planted-domains",
              },
              (at) =>
                Effect.gen(function* plantedCase() {
                  const planted = plantedCases[at];
                  assert.isDefined(planted, `no planted case ${String(at)}`);
                  if (planted !== undefined) {
                    const judged = yield* judgeOne(yield* genomeOf(planted.entries), bench, at);
                    const domains = judged.disagreements.filter(
                      (disagreement) =>
                        (disagreement.kind === "oracle-only-law" ||
                          disagreement.kind === "import-only-law") &&
                        disagreement.law === "value domain",
                    );
                    assert.deepStrictEqual(
                      domains.map(shownDisagreement),
                      [],
                      `${planted.name}: the oracle says ${judged.summary.oracle}, the import's rows ${judged.summary.import}`,
                    );
                  }
                }),
            );
          }).pipe(Effect.scoped),
        ),
      600_000,
    );

    it.effect(
      "breeds no package the two judge differently",
      (ctx) =>
        // Oracle: a second implementation, the law oracle, against readProgram's refusal and the
        // laws its rows hold on the host. Bound: per run, the budget above, each candidate one to
        // its most edits from a parent of the corpus or of the run's population, every other one
        // judged beside a noised copy.
        searched(
          ctx,
          Effect.gen(function* searchRuns() {
            const corpus = yield* corpusOf(grammar);
            const directory = yield* scratchDirectory("genetic-");
            const bench = { directory, grammar, laws };

            return yield* explore(
              {
                caseHang: Duration.minutes(20),
                concurrency: 1,
                coverage: noCoverage,
                draw: drawn(runSketch),
                kept: [],
                literal: runLiteral,
                oracle: {
                  kind: "second-implementation",
                  name: "the law oracle against readProgram's refusal and its rows' host laws",
                },
                runs: chosen.runs,
                shrink: boundedShrink(0),
                steerEvery: 1,
                suite: "pantry/genetic-differential",
              },
              (sketch, c) =>
                Effect.gen(function* oneRun() {
                  const report = yield* hunt(corpus, bench, chosen.budget, chosen.tries, sketch);
                  c.noteAll(report.evolved.features.keys());
                  for (const law of report.isolation.alone) {
                    isolation.alone.add(law);
                  }

                  for (const [law, count] of report.isolation.raised) {
                    isolation.raised.set(law, (isolation.raised.get(law) ?? 0) + count);

                    const now = report.isolation.beside.get(law) ?? new Set<string>();
                    const held = isolation.beside.get(law);
                    isolation.beside.set(
                      law,
                      new Set(
                        held === undefined ? now : [...now].filter((other) => held.has(other)),
                      ),
                    );
                  }
                  if (Option.isNone(c.steering)) {
                    rotatingRuns += 1;
                    for (const feature of report.evolved.features.keys()) {
                      acrossRuns.set(feature, (acrossRuns.get(feature) ?? 0) + 1);
                    }
                  }

                  console.log(`genetic run ${runLiteral(sketch)}: ${shownResidual(report)}`);
                  assert.deepStrictEqual(
                    report.reduced.map(({ signature }) => signature),
                    [],
                    `the import's host path and the law oracle disagree:\n\n${shownReport(report)}`,
                  );
                }),
            );
          }).pipe(Effect.scoped),
        ),
      3_600_000,
    );
  },
);

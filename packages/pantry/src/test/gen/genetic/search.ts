/**
 * The genetic differential's hunt: one run of the genetic loop
 * (`#pantry/test/gen/genetic/engine.ts`) over the seed population (`corpus.ts`), bred by the
 * package edits (`mutate.ts`) under the run's swarm, each candidate judged by the law oracle and
 * the import's host path (`judge.ts`); then each class of disagreement it found reduced to the
 * smallest package that still shows it.
 *
 * A run is drawn as a {@link RunSketch}, its seed and its swarm, on the tape of one `explore` case,
 * so the case's replay token replays the whole run, and with it every candidate it bred.
 */
import { int } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { swarm } from "@grizzle/testing/swarm";
import type { Swarm } from "@grizzle/testing/swarm";
import { Effect } from "effect";
import type { Corpus } from "#pantry/test/gen/genetic/corpus.ts";
import { evolve, reduce } from "#pantry/test/gen/genetic/engine.ts";
import type { Budget, Evolved } from "#pantry/test/gen/genetic/engine.ts";
import { cutsOf, entriesOf, shownEntries } from "#pantry/test/gen/genetic/genome.ts";
import type { Genome } from "#pantry/test/gen/genetic/genome.ts";
import {
  familyOf,
  judgeOne,
  movedBy,
  shownDisagreement,
  signatureOf,
} from "#pantry/test/gen/genetic/judge.ts";
import type { Bench, Disagreement, Feature, Judged } from "#pantry/test/gen/genetic/judge.ts";
import { noised } from "#pantry/test/gen/genetic/noise.ts";
import type { Noise } from "#pantry/test/gen/genetic/noise.ts";
import { mutationOf, operators } from "#pantry/test/gen/genetic/mutate.ts";
import type { Breeding, Operator } from "#pantry/test/gen/genetic/mutate.ts";

/**
 * The noise each candidate's copy takes, in turn, none for a candidate judged alone: every other
 * candidate is judged beside a noised copy, attribute order every other time, since a rule named by
 * which attribute came first is the history's most repaired refusal-naming bug (d31495a8,
 * 4e6dc428).
 */
const noiseSchedule: readonly (Noise | undefined)[] = [
  "attribute-order",
  undefined,
  "prefix-rename",
  undefined,
  "attribute-order",
  undefined,
  "resource-order",
  undefined,
  "attribute-order",
  undefined,
  "path-rename",
  undefined,
];

/**
 * One run as its case draws it: the swarm its edits are weighed by, and the seed its every choice
 * is drawn from.
 */
export interface RunSketch {
  readonly seed: number;
  readonly swarm: Swarm<Operator>;
}

/**
 * The largest seed a run draws: 2^31 − 1, a whole 31-bit word.
 */
const largestSeed = 0x7f_ff_ff_ff;

/**
 * Draw a run: its swarm over every operator first, one of them always on, then its seed.
 */
export const runSketch: Gen<RunSketch> = (source) => ({
  seed: source.draw(int(0, largestSeed)),
  swarm: source.draw(swarm(operators)),
});

/**
 * Write a run's sketch as the literal a kept case pastes back.
 *
 * @param sketch - The sketch.
 * @returns The literal.
 */
export const runLiteral = (sketch: RunSketch): string =>
  `{ seed: ${String(sketch.seed)}, swarm: { ${Object.entries(sketch.swarm)
    .map(([operator, weight]) => `"${operator}": ${String(weight)}`)
    .join(", ")} } }`;

/**
 * One class of disagreement a run found, reduced: its signature, the disagreement as the reduced
 * package shows it, the edits that bred the first candidate that showed it, and the reduced
 * package's text.
 */
export interface Reduced {
  readonly disagreement: Disagreement;
  readonly lineage: readonly string[];
  readonly package: string;
  readonly signature: string;
  readonly tries: number;
}

/**
 * What a run learned of each law the oracle raised (the history's 5.1, a law broken alone): the
 * candidates that raised it, whether one raised it alone, and the laws every candidate that raised
 * it raised beside it, the evidence that a law no candidate broke alone is subsumed by another.
 */
export interface Isolation {
  readonly alone: ReadonlySet<string>;
  readonly beside: ReadonlyMap<string, ReadonlySet<string>>;
  readonly raised: ReadonlyMap<string, number>;
}

/**
 * What one run found: the engine's report, each class of disagreement reduced, and what it learned
 * of each law's isolation.
 */
export interface HuntReport {
  readonly evolved: Evolved<Genome, Feature, Disagreement>;
  readonly isolation: Isolation;
  readonly reduced: readonly Reduced[];
}

/**
 * Run the hunt for one sketch.
 *
 * @param corpus - The seed population.
 * @param bench - The bench the judge reads.
 * @param budget - The run's budget.
 * @param tries - The most candidates each reduction judges.
 * @param sketch - The run.
 * @returns The report.
 */
export const hunt = Effect.fnUntraced(function* hunt(
  corpus: Corpus,
  bench: Bench,
  budget: Budget,
  tries: number,
  sketch: RunSketch,
) {
  let judged = 0;
  const judgeAt = (genome: Genome) => {
    judged += 1;

    return judgeOne(genome, bench, judged);
  };
  const withTwin = (genome: Genome, noise: Noise, salt: number) =>
    Effect.gen(function* withNoise() {
      const own = yield* judgeAt(genome);
      const twin = yield* judgeAt(noised(genome, noise, salt));

      return {
        ...own,
        disagreements: [...own.disagreements, ...movedBy(own, twin, noise, salt)],
      } satisfies Judged;
    });
  const breeding: Breeding = {
    corpus,
    grammar: bench.grammar,
    lastEdit: new WeakMap(),
    rewards: new Map(),
    swarm: sketch.swarm,
  };
  const raised = new Map<string, number>();
  const beside = new Map<string, Set<string>>();
  const alone = new Set<string>();
  const isolate = (judgment: Judged): void => {
    const laws = judgment.summary.oracle.startsWith("laws ")
      ? judgment.summary.oracle
          .slice("laws ".length)
          .split(", ")
          .filter((law) => law !== "")
      : [];
    if (laws.length === 1) {
      alone.add(laws[0] ?? "");
    }

    for (const law of laws) {
      raised.set(law, (raised.get(law) ?? 0) + 1);

      const others = laws.filter((other) => other !== law);
      const held = beside.get(law);
      beside.set(
        law,
        new Set(held === undefined ? others : others.filter((other) => held.has(other))),
      );
    }
  };
  const rewarded = new Set<string>();
  const reward = (genome: Genome, judgment: Judged): Judged => {
    isolate(judgment);

    const operator = breeding.lastEdit.get(genome);
    for (const disagreement of judgment.disagreements) {
      const signature = signatureOf(disagreement);
      if (!rewarded.has(signature)) {
        rewarded.add(signature);
        if (operator !== undefined) {
          breeding.rewards.set(operator, (breeding.rewards.get(operator) ?? 0) + 1);
        }
      }
    }

    return judgment;
  };
  const judgeAll = (genomes: readonly Genome[]) =>
    Effect.forEach([...genomes], (genome) => {
      const noise = noiseSchedule[judged % noiseSchedule.length];

      const judging = noise === undefined ? judgeAt(genome) : withTwin(genome, noise, judged);

      return judging.pipe(Effect.map((judgment) => reward(genome, judgment)));
    });
  const evolved = yield* evolve(
    {
      familyOf,
      judge: judgeAll,
      mutate: mutationOf(breeding),
      seeds: corpus.seeds.map(({ genome }) => genome),
      signatureOf,
    },
    budget,
    sketch.seed,
  );
  const reduced = yield* Effect.forEach([...evolved.found], ([signature, found]) =>
    Effect.gen(function* reduceOne() {
      const { disagreement: first } = found;
      const shown = (genome: Genome) =>
        first.kind === "noise-moved" ? withTwin(genome, first.noise, first.salt) : judgeAt(genome);
      const { genome, tries: spent } = yield* reduce(
        found.genome,
        cutsOf,
        (genomes) =>
          Effect.forEach([...genomes], (candidate) =>
            Effect.map(shown(candidate), ({ disagreements }) =>
              disagreements.some((disagreement) => signatureOf(disagreement) === signature),
            ),
          ),
        tries,
        1,
      );
      const last = yield* shown(genome);

      return {
        disagreement:
          last?.disagreements.find((disagreement) => signatureOf(disagreement) === signature) ??
          found.disagreement,
        lineage: found.lineage,
        package: shownEntries(yield* Effect.orDie(entriesOf(genome))),
        signature,
        tries: spent,
      } satisfies Reduced;
    }),
  );

  return { evolved, isolation: { alone, beside, raised }, reduced } satisfies HuntReport;
});

/**
 * Write a run's findings as its failure report: each class of disagreement, the edits that bred
 * it, and its reduced package.
 *
 * @param report - The run's report.
 * @returns The report's text.
 */
export const shownReport = (report: HuntReport): string =>
  report.reduced
    .map(
      ({ disagreement, lineage, package: shown, signature, tries }) =>
        `== ${signature}\n${shownDisagreement(disagreement)}\nbred by: ${lineage.join("; ") || "a seed, unedited"}\nreduced in ${String(tries)} tries to:\n${shown}`,
    )
    .join("\n\n");

/**
 * Write a run's residual risk: Good–Turing's estimate for each feature family, singletons over
 * candidates.
 *
 * @param report - The run's report.
 * @returns One line.
 */
export const shownResidual = (report: HuntReport): string =>
  `${String(report.evolved.evaluated)} candidates, ${String(report.evolved.population)} kept; ${report.evolved.residual
    .map(
      ({ estimate, family, observed, singletons }) =>
        `${family} ${String(singletons)}/${String(report.evolved.evaluated)} = ${estimate.toFixed(3)} (${String(observed)} features)`,
    )
    .join(", ")}`;

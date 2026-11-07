/**
 * The genetic search's loop, generic over the genome it breeds and the features it perceives: a
 * population seeded by construction, a parent picked by novelty, mutated and crossed with a mate,
 * judged against an oracle, and kept when it shows a feature no candidate of the run had shown.
 * Every disagreement the judge reports is collected by its signature, with the first candidate that
 * showed it and the edits that bred it, so one run reports every bug class it meets.
 *
 * A run is a pure function of its seed: its every choice is drawn from one stream of
 * `@grizzle/testing`'s words, the mutations as generators on the choice stream, so the same seed
 * breeds the same candidates and every failure replays. The loop is the search's body inside one
 * `explore` case, whose tape holds the seed and the swarm.
 *
 * The residual is Good–Turing's estimate per feature family: the features of the family seen in
 * exactly one candidate, over the candidates judged. It measures the generator and its features,
 * never the program, so it is residual risk, not proof.
 */
import { generate, randomChooser } from "@grizzle/testing/source";
import type { Source } from "@grizzle/testing/source";
import { wordsOf } from "@grizzle/testing/random";
import { Array as Arr, Effect, Option } from "effect";

/**
 * A generator on the choice stream: `@grizzle/testing`'s `Gen`, restated so the engine names no
 * more of the library than it draws on.
 */
type Gen<A> = (source: Source) => A;

/**
 * What a judge says of one candidate: the features it showed and the disagreements between the
 * implementations it judged, each a bug.
 */
export interface Judgment<F extends string, D> {
  readonly disagreements: readonly D[];
  readonly features: ReadonlySet<F>;
}

/**
 * One edit a mutation made: the genome it gives and a note naming the edit, its operator or its
 * named fault first, which the lineage of a candidate lists.
 */
export interface Edited<G> {
  readonly genome: G;
  readonly note: string;
}

/**
 * The problem a run searches: the seed population, the edits it breeds by, the judge, and how its
 * findings are keyed.
 *
 * - `seeds` are the population a run starts from, built by construction.
 * - `mutate` draws one edit of `parent` on the choice stream, `mate` the second parent a crossover
 *   takes its part from; none where the drawn edit has no site in the parent.
 * - `judge` judges one generation of candidates at once, one judgment per candidate in their order,
 *   so a judge that pays a start-up cost per call (a validator's schema compile) pays it once per
 *   generation.
 * - `signatureOf` keys a disagreement by its class, so a run keeps the first candidate of each.
 * - `familyOf` names the feature set a feature belongs to, for its residual.
 */
export interface Problem<G, F extends string, D, E, R> {
  readonly familyOf: (feature: F) => string;
  readonly judge: (genomes: readonly G[]) => Effect.Effect<readonly Judgment<F, D>[], E, R>;
  readonly mutate: (parent: G, mate: G) => Gen<Option.Option<Edited<G>>>;
  readonly seeds: readonly G[];
  readonly signatureOf: (disagreement: D) => string;
}

/**
 * A run's budget: the candidates it breeds past its seeds, how many it breeds per generation, how
 * many seeds it starts from, and the most edits one candidate takes from its parent.
 */
export interface Budget {
  readonly candidates: number;
  readonly edits: number;
  readonly generation: number;
  readonly initial: number;
}

/**
 * The first candidate of a run that showed a class of disagreement: the disagreement, the genome,
 * and the notes of the edits that bred it from its seed, in order.
 */
export interface Found<G, D> {
  readonly disagreement: D;
  readonly genome: G;
  readonly lineage: readonly string[];
}

/**
 * Good–Turing's estimate over one feature family: the candidates judged, the features of the
 * family they showed, those shown by exactly one candidate, and the estimate, singletons over
 * candidates, the chance the next candidate shows a feature of the family no candidate showed.
 */
export interface Residual {
  readonly candidates: number;
  readonly estimate: number;
  readonly family: string;
  readonly observed: number;
  readonly singletons: number;
}

/**
 * What a run found: each class of disagreement by its signature, the candidates it judged, the
 * population it ended with, each feature with the candidates that showed it, and the residual of
 * each feature family.
 */
export interface Evolved<G, F extends string, D> {
  readonly evaluated: number;
  readonly features: ReadonlyMap<F, number>;
  readonly found: ReadonlyMap<string, Found<G, D>>;
  readonly population: number;
  readonly residual: readonly Residual[];
}

/**
 * One member of a run's population: its genome, its lineage, and the features it showed.
 */
interface Member<G, F extends string> {
  readonly features: ReadonlySet<F>;
  readonly genome: G;
  readonly lineage: readonly string[];
}

/**
 * Draw a whole number from 0 to `count - 1`, uniformly.
 *
 * @param count - How many values there are, at least 1.
 * @returns The generator.
 */
export const below =
  (count: number): Gen<number> =>
  (source) =>
    count <= 1 ? 0 : source.pick(0, count - 1);

/**
 * Draw one item of a list, uniformly.
 *
 * @param items - The items.
 * @returns The generator, undefined for an empty list.
 */
export const oneOf =
  <A>(items: readonly A[]): Gen<A | undefined> =>
  (source) =>
    items.length === 0 ? undefined : items[source.draw(below(items.length))];

/**
 * Draw how many edits a candidate takes: one half the time, two a quarter, and so on up to the
 * most, so most candidates stand one edit from their parent.
 *
 * @param most - The most edits.
 * @returns The generator.
 */
const editCount =
  (most: number): Gen<number> =>
  (source) => {
    let edits = 1;
    while (edits < most && source.pick(0, 1) === 1) {
      edits += 1;
    }

    return edits;
  };

/**
 * The resolution of a parent's draw: one choice among 2^20 places the roulette's ball.
 */
const pickScale = 1_048_576;

/**
 * Build the draw of a parent from a population by novelty: each member weighs the sum, over the
 * features it showed, of one over how many candidates showed that feature, so a member that holds
 * the run's rarest features is picked most often, as AFL favours the inputs that cover its rarest
 * edges, and the frontier stays favoured however often it is reached. The weights are computed
 * once, for a generation whose population and counts are fixed, and each draw is a binary search
 * over their running sums.
 *
 * @param members - The population, never empty.
 * @param counts - Each feature's candidates.
 * @returns The generator.
 */
const parentOf = <G, F extends string>(
  members: Arr.NonEmptyReadonlyArray<Member<G, F>>,
  counts: ReadonlyMap<F, number>,
): Gen<Member<G, F>> => {
  const sums: number[] = [];
  let total = 0;
  for (const member of members) {
    for (const feature of member.features) {
      total += 1 / (counts.get(feature) ?? 1);
    }

    total += 1 / members.length;
    sums.push(total);
  }

  return (source) => {
    const ball = (source.pick(0, pickScale - 1) / pickScale) * total;
    let low = 0;
    let high = sums.length - 1;
    while (low < high) {
      const middle = Math.floor((low + high) / 2);
      if ((sums[middle] ?? total) > ball) {
        high = middle;
      } else {
        low = middle + 1;
      }
    }

    return members[low] ?? Arr.lastNonEmpty(members);
  };
};

/**
 * Compute Good–Turing's estimate for each feature family.
 *
 * @param counts - Each feature's candidates.
 * @param candidates - The candidates judged.
 * @param familyOf - The family of a feature.
 * @returns One residual per family, by family name.
 */
export const residualsOf = <F extends string>(
  counts: ReadonlyMap<F, number>,
  candidates: number,
  familyOf: (feature: F) => string,
): readonly Residual[] => {
  const families = new Map<string, { observed: number; singletons: number }>();
  for (const [feature, count] of counts) {
    const family = familyOf(feature);
    const held = families.get(family) ?? { observed: 0, singletons: 0 };
    families.set(family, {
      observed: held.observed + 1,
      singletons: held.singletons + (count === 1 ? 1 : 0),
    });
  }

  return [...families]
    .toSorted(([left], [right]) => (left < right ? -1 : 1))
    .map(([family, { observed, singletons }]) => ({
      candidates,
      estimate: candidates === 0 ? 1 : singletons / candidates,
      family,
      observed,
      singletons,
    }));
};

/**
 * Run the genetic search: judge `budget.initial` distinct seeds drawn from the problem's
 * population, then breed `budget.candidates` candidates in generations of `budget.generation`. Each
 * candidate of a generation is a parent picked by novelty over the population and the feature
 * counts as the generation began, with one to `budget.edits` edits, any of which may cross it with
 * a second parent; the generation is judged in one call and folded in in order. A candidate that
 * shows a feature no earlier candidate showed joins the population. Every disagreement is kept by
 * its signature with the first candidate that showed it. A generation of one breeds each candidate
 * from the population every earlier candidate left.
 *
 * @param problem - The problem.
 * @param budget - The budget.
 * @param seed - The run's seed: every choice of the run is drawn from it.
 * @returns What the run found; the judge's error fails it.
 */
export const evolve = Effect.fnUntraced(function* evolve<G, F extends string, D, E, R>(
  problem: Problem<G, F, D, E, R>,
  budget: Budget,
  seed: number,
): Effect.fn.Return<Evolved<G, F, D>, E, R> {
  const chooser = randomChooser(wordsOf(seed));
  const draw = <A>(generator: Gen<A>): A => generate(generator, chooser).value;
  const counts = new Map<F, number>();
  const found = new Map<string, Found<G, D>>();
  const members: Member<G, F>[] = [];
  let evaluated = 0;
  const judged = Effect.fnUntraced(function* judged(
    bred: readonly { readonly genome: G; readonly lineage: readonly string[] }[],
  ) {
    const judgments = yield* problem.judge(bred.map(({ genome }) => genome));
    for (const [at, { genome, lineage }] of bred.entries()) {
      const judgment = judgments[at];
      if (judgment !== undefined) {
        evaluated += 1;
        let novel = false;
        for (const feature of judgment.features) {
          novel ||= !counts.has(feature);
          counts.set(feature, (counts.get(feature) ?? 0) + 1);
        }

        for (const disagreement of judgment.disagreements) {
          const signature = problem.signatureOf(disagreement);
          if (!found.has(signature)) {
            found.set(signature, { disagreement, genome, lineage });
          }
        }

        if (novel || members.length === 0) {
          members.push({ features: judgment.features, genome, lineage });
        }
      }
    }
  });

  const pool = [...problem.seeds];
  const initial: { genome: G; lineage: readonly string[] }[] = [];
  while (initial.length < budget.initial && pool.length > 0) {
    const [genome] = pool.splice(draw(below(pool.length)), 1);
    if (genome !== undefined) {
      initial.push({ genome, lineage: [] });
    }
  }

  yield* judged(initial);

  const size = Math.max(1, budget.generation);
  for (let bred = 0; bred < budget.candidates; bred += size) {
    const population: readonly Member<G, F>[] = [...members];
    if (!Arr.isReadonlyArrayNonEmpty(population)) {
      break;
    }

    const pick = parentOf(population, counts);
    const generation: { genome: G; lineage: readonly string[] }[] = [];
    for (let child = 0; child < Math.min(size, budget.candidates - bred); child += 1) {
      const parent = draw(pick);
      const edits = draw(editCount(budget.edits));
      let current = parent.genome;
      const lineage = [...parent.lineage];
      for (let edit = 0; edit < edits; edit += 1) {
        const mate = draw(pick);
        const edited = draw(problem.mutate(current, mate.genome));
        if (Option.isSome(edited)) {
          current = edited.value.genome;
          lineage.push(edited.value.note);
        }
      }

      if (lineage.length > parent.lineage.length) {
        generation.push({ genome: current, lineage });
      }
    }

    yield* judged(generation);
  }

  return {
    evaluated,
    features: counts,
    found,
    population: members.length,
    residual: residualsOf(counts, evaluated, problem.familyOf),
  };
});

/**
 * Reduce a failing genome by hierarchical delta debugging: judge the smaller genomes `smaller`
 * proposes, in order and `batch` at a time, keep the first that still fails, and start again from
 * it, resuming the next round's proposals at the place of the cut that succeeded (the cuts before
 * it failed once already), until no proposal fails or the budget of tries is spent. `smaller`
 * proposes the largest cuts first (whole entries, then subtrees from the root down, then
 * attributes), so a few tries remove most of a genome. A batch of one judges each proposal alone.
 *
 * @param genome - The failing genome.
 * @param smaller - The genomes one cut smaller, largest cut first.
 * @param fails - Whether each genome of a batch still fails as the original does, in its order.
 * @param tries - The most proposals judged.
 * @param batch - The proposals judged in one call.
 * @returns The smallest failing genome reached, and the tries spent.
 */
export const reduce = Effect.fnUntraced(function* reduce<G, E, R>(
  genome: G,
  smaller: (genome: G) => readonly G[],
  fails: (genomes: readonly G[]) => Effect.Effect<readonly boolean[], E, R>,
  tries: number,
  batch: number,
): Effect.fn.Return<{ readonly genome: G; readonly tries: number }, E, R> {
  const size = Math.max(1, batch);
  let best = genome;
  let spent = 0;
  let resume = 0;
  let progressed = true;
  while (progressed && spent < tries) {
    progressed = false;
    const proposed = smaller(best);
    const from = proposed.length === 0 ? 0 : resume % proposed.length;
    const proposals = [...proposed.slice(from), ...proposed.slice(0, from)];
    for (let start = 0; start < proposals.length && spent < tries; start += size) {
      const chunk = proposals.slice(start, start + Math.min(size, tries - spent));
      spent += chunk.length;
      const verdicts = yield* fails(chunk);
      const at = verdicts.indexOf(true);
      const reduced = chunk[at];
      if (at !== -1 && reduced !== undefined) {
        best = reduced;
        resume = from + start + at;
        progressed = true;
        break;
      }
    }
  }

  return { genome: best, tries: spent };
});

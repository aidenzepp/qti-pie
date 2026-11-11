/**
 * The genetic search over lexical forms (`#pantry/test/gen/genetic/lexical-search.ts`): values bred
 * from each domain's own forms toward the edges of the lexical spaces, each judged by the grammar's
 * domain and by libxml2's XML Schema validator, through the harness `lexical.oracle.test.ts`'s box
 * judges with, against the box's one list of records.
 *
 * Oracle: a second implementation, `xmllint --schema` on one-attribute and one-text probes, beside
 * the grammar's `lexical ~ pattern` and residual facets. A disagreement no record classifies is a
 * defect of one side; the run reduces each one it found (`reduce`, largest cut first), prints it
 * shrunk, and fails.
 *
 * Budget: the free suite judges every seed in one `xmllint` round, one process per version;
 * `GR8DES_GENETIC=1` breeds the long run at merge time. Each run draws its seed from the run's own
 * (`TEST_SEED` replays it), and its swarm over the edits from that seed, so different runs explore
 * different corners and a failing run replays exactly.
 *
 * Stopping: each feature family's Good–Turing residual, the families' features seen once over the
 * candidates judged, is printed for every run: the chance the next candidate shows a feature of the
 * family no candidate showed. It measures the generator and its features, not the grammar.
 *
 * Gated on the XSD cache. Each run writes a folder of its own, `work/genetic-lexical-*`, removed
 * when the run ends.
 */
import { assert, describe, layer } from "@effect/vitest";
import { swarm } from "@grizzle/testing/swarm";
import { floorSeed, rotatingSeed } from "@grizzle/testing/random";
import { sample } from "@grizzle/testing/source";
import { runOfProcess } from "@grizzle/testing/vitest/run";
import { Console, Effect, Option } from "effect";
import { composed } from "#pantry/grammar/compose.ts";
import { evolve, reduce } from "#pantry/test/gen/genetic/engine.ts";
import type { Budget } from "#pantry/test/gen/genetic/engine.ts";
import {
  lexicalOperators,
  lexicalProblem,
  probesOfGenome,
  searchSitesOf,
  sharedJudge,
  signatureOf,
  smallerOf,
} from "#pantry/test/gen/genetic/lexical-search.ts";
import type {
  Finding,
  LexicalBreeding,
  LexicalGenome,
} from "#pantry/test/gen/genetic/lexical-search.ts";
import { disagreementOf, recordOf, sitesOf, subjectName } from "#pantry/test/lexical-harness.ts";
import { scratchDirectory } from "#pantry/test/scratch.ts";
import { settings } from "#pantry/test/settings.ts";
import { XsdOracleLayer } from "#pantry/test/gen/grammar.ts";
import { writeXsdOracle, xsdCached } from "#pantry/test/xsd-catalog.ts";

/**
 * The bounded budget, the free suite's: every seed, judged in one `xmllint` round of one process
 * per version, and no bred generation. A round's time is the validator's compile of the XSDs,
 * whether it holds 1,500 probes or 8,000, so the free suite pays for one round and spends the
 * breeding, where the generations' novelty pays, under `GR8DES_GENETIC=1` at merge time.
 */
const bounded: Budget = { candidates: 0, edits: 3, generation: 2400, initial: 2000 };

/**
 * The long budget, `GR8DES_GENETIC=1`'s: every seed and twelve generations.
 */
const long: Budget = { candidates: 48_000, edits: 4, generation: 4000, initial: 2000 };

/**
 * The most classes of disagreement a run reduces, and the most proposals one reduction judges.
 */
const reduced = { findings: 12, tries: 400 } as const;

/**
 * The timeout, in milliseconds, for the bounded run: a hang guard.
 */
const boundedTimeoutMs = 660_000;

/**
 * The timeout, in milliseconds, for the long run: a hang guard.
 */
const longTimeoutMs = 1_260_000;

/**
 * Write a finding as one line: where, both verdicts, the value as JSON and the edge classes.
 *
 * @param finding - The finding.
 * @returns The line.
 */
const findingLine = ({ disagreement, edges }: Finding): string =>
  `${disagreement.probe.version} ${disagreement.probe.kind}@${subjectName(disagreement.probe.subject)} ${disagreement.probe.domain.handle}: ${JSON.stringify(disagreement.probe.value)} xmllint ${disagreement.xsd}, grammar ${disagreement.grammar ? "accepts" : "refuses"} [${edges.join(" ")}]${disagreement.messages === "" ? "" : ` (${disagreement.messages.slice(0, 160)})`}`;

describe.skipIf(!xsdCached)("genetic-lexical.oracle.test.ts, bred values against xmllint", () => {
  layer(XsdOracleLayer, { excludeTestServices: true })("the lexical search", (it) => {
    it.effect(
      "breeds no value the grammar's domain and the XSD's validator judge apart, but as recorded",
      () =>
        Effect.gen(function* searchValues() {
          const grammar = yield* Effect.fromResult(composed()).pipe(Effect.orDie);
          const directory = yield* scratchDirectory("genetic-lexical-");
          const begun = Date.now();
          const harness = yield* sitesOf(grammar);
          const oracle = yield* writeXsdOracle(`${directory}/oracle`, harness.declarations);
          const run = yield* runOfProcess;
          const seed = rotatingSeed(run.seed, floorSeed("pantry/genetic-lexical"));
          const [drawnSwarm] = sample(swarm(lexicalOperators), seed, 1);
          const breeding: LexicalBreeding = {
            directory,
            oracle,
            sites: searchSitesOf(harness),
            swarm: drawnSwarm ?? {},
          };
          const budget = settings.geneticRequested ? long : bounded;

          yield* Console.log(
            `genetic-lexical: ${String(breeding.sites.length)} sites ready in ${String(Date.now() - begun)} ms`,
          );

          const evolved = yield* evolve(lexicalProblem(breeding), budget, seed);

          // One finding per (version, site, verdicts), the first the run met, reduced.
          const classes = new Map<string, Finding>();
          const lineages = new Map<Finding, readonly string[]>();
          for (const { disagreement: finding, lineage } of evolved.found.values()) {
            const { grammar: accepted, probe, xsd } = finding.disagreement;
            const key = `${probe.version} ${probe.group} ${xsd} ${String(accepted)}`;
            if (!classes.has(key)) {
              classes.set(key, finding);
              lineages.set(finding, lineage);
            }
          }

          const report = [
            `genetic-lexical: TEST_SEED=${String(run.seed)}, stream pantry/genetic-lexical, ${settings.geneticRequested ? "long" : "bounded"} budget ${JSON.stringify(budget)}, swarm ${JSON.stringify(breeding.swarm)}`,
            `  ${String(breeding.sites.length)} sites, ${String(evolved.evaluated)} candidates judged, population ${String(evolved.population)}, ${String(evolved.features.size)} features, ${String(evolved.found.size)} signatures of ${String(classes.size)} unrecorded classes, in ${String(Date.now() - begun)} ms`,
            ...evolved.residual.map(
              ({ candidates, estimate, family, observed, singletons }) =>
                `  residual ${family}: ${String(singletons)} seen once of ${String(observed)} over ${String(candidates)} candidates, f1/n = ${estimate.toFixed(4)}`,
            ),
            ...[...classes.values()].map(
              (finding) =>
                `  found ${findingLine(finding)}, bred by ${(lineages.get(finding) ?? []).join(" ") || "none (a seed)"}`,
            ),
          ];
          yield* Console.log(report.join("\n"));

          // Every class is reduced at once, each round of all of them one batch per version.
          const chosen = [...classes.values()].slice(0, reduced.findings);
          const shared = sharedJudge(breeding, chosen.length);
          const shrunk = yield* Effect.forEach(
            chosen,
            (finding) =>
              Effect.gen(function* shrinkFinding() {
                const { probe, xsd, grammar: accepted } = finding.disagreement;
                const genome: LexicalGenome = {
                  site: breeding.sites.findIndex(({ key }) => key === probe.group),
                  value: probe.value,
                };
                const fails = (genomes: readonly LexicalGenome[]) =>
                  Effect.gen(function* stillFails() {
                    const probes = genomes.map((held) =>
                      probesOfGenome(breeding.sites, held).filter(
                        ({ version }) => version === probe.version,
                      ),
                    );
                    const judged = yield* shared.judge(probes.flat());

                    return probes.map((held) =>
                      held.some((each) =>
                        Option.exists(
                          Option.flatMap(Option.fromUndefinedOr(judged.get(each)), disagreementOf),
                          (found) =>
                            found.xsd === xsd &&
                            found.grammar === accepted &&
                            recordOf(found) === undefined,
                        ),
                      ),
                    );
                  });
                const { genome: smallest } = yield* reduce(
                  genome,
                  smallerOf,
                  fails,
                  reduced.tries,
                  reduced.tries,
                ).pipe(Effect.ensuring(Effect.orDie(shared.done)));

                return `${findingLine(finding)}; shrunk to ${JSON.stringify(smallest.value)}`;
              }),
            { concurrency: "unbounded" },
          );

          yield* Console.log(shrunk.map((line) => `genetic-lexical: FOUND ${line}`).join("\n"));

          assert.deepStrictEqual(
            [...evolved.found.values()]
              .map(({ disagreement }) => signatureOf(disagreement))
              .slice(0, 40),
            [],
            `every bred value is judged alike by both sides, but as recorded; shrunk: ${shrunk.join(" | ")}`,
          );
        }).pipe(Effect.scoped),
      { timeout: settings.geneticRequested ? longTimeoutMs : boundedTimeoutMs },
    );
  });
});

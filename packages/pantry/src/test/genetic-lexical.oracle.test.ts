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
 * Budget: the free suite breeds a bounded run in a few generations, one `xmllint` process per
 * version a generation; `GR8DES_GENETIC=1` breeds the long one. Each run draws its seed from the
 * run's own (`TEST_SEED` replays it), and its swarm over the edits from that seed, so different
 * runs explore different corners and a failing run replays exactly.
 *
 * Stopping: each feature family's Good–Turing residual, the families' features seen once over the
 * candidates judged, is printed for every run: the chance the next candidate shows a feature of the
 * family no candidate showed. It measures the generator and its features, not the grammar.
 *
 * Gated on the XSD cache. Each run writes a folder of its own, `work/genetic-lexical-*`, removed
 * when the run ends.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, describe, layer } from "@effect/vitest";
import { swarm } from "@grizzle/testing/swarm";
import { floorSeed, rotatingSeed } from "@grizzle/testing/random";
import { sample } from "@grizzle/testing/source";
import { runOfProcess } from "@grizzle/testing/vitest/run";
import { Console, Effect, Layer, Option } from "effect";
import { Digest } from "effect/crypto";
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
import { writeXsdOracle } from "#pantry/test/xsd-catalog.ts";
import { checkCache } from "#pantry/vocab/derive/sources.ts";
import { OracleLayer } from "#pantry/xml/oracle.ts";

/**
 * Whether the XSD cache holds every pin.
 */
const cached = await Effect.runPromise(
  checkCache().pipe(
    Effect.as(true),
    Effect.catchTag("XsdSourceMissing", () => Effect.succeed(false)),
    Effect.provide(NodeServices.layer),
  ),
);

/**
 * The services the search reads and spawns with.
 */
const TestLayer = Layer.mergeAll(
  NodeServices.layer,
  Digest.layerWebCrypto,
  OracleLayer.pipe(Layer.provide(NodeServices.layer)),
);

/**
 * The bounded budget, the free suite's: every seed and two generations, each generation one
 * `xmllint` process per version. A round's time is the validator's compile of the XSDs, 29 to 49 s
 * at load averages of 75 to 83 whether it holds 1,500 probes or 8,000, so a generation is as large
 * as a batch stays small.
 */
const bounded: Budget = { candidates: 4800, edits: 3, generation: 2400, initial: 2000 };

/**
 * The long budget, `GR8DES_GENETIC=1`'s: every seed and twelve generations.
 */
const long: Budget = { candidates: 48_000, edits: 4, generation: 4000, initial: 2000 };

/**
 * The most classes of disagreement a run reduces, and the most proposals one reduction judges.
 */
const reduced = { findings: 12, tries: 400 } as const;

/**
 * The timeout, in milliseconds, for the bounded run: the grammar and the sites, three `xmllint`
 * rounds of two processes each, and the reduction of what it found. Measured 2026-11-07: 302 s at a
 * load average of 75 to 83, the slowest whole test of seven runs (TEST_SEED=1, in clean archives
 * with and without planted bugs): the search took 152 to 191 s and the whole test 237 to 302 s, the
 * slowest reducing 12 of 113 classes. The budget is twice the slowest, rounded up to the next
 * minute. Raise it only on a new measurement recorded here, never to make a run pass.
 */
const boundedTimeoutMs = 660_000;

/**
 * The timeout, in milliseconds, for the long run. Measured 2026-11-07: 614 s at a load average of
 * 80, the whole test of two runs near that load (TEST_SEED=1, 48,710 candidates), whose search took
 * 475 to 482 s. The budget is twice the slowest, rounded up to the next minute.
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

describe.skipIf(!cached)("genetic-lexical.oracle.test.ts, bred values against xmllint", () => {
  layer(TestLayer, { excludeTestServices: true })("the lexical search", (it) => {
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

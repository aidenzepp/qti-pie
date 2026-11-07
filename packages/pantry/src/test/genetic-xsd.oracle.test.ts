/**
 * The grammar against `xmllint`, by a genetic search over documents (lane GEN-B): documents built
 * by construction from the composed grammar's content automata and attribute domains (the XDM
 * generator, `#pantry/test/gen/xdm.ts`), bred by the package search's edits and the document's own
 * named invalid cases (`#pantry/test/gen/genetic/document-xsd.ts`), each judged in both schema
 * versions by libxml2's XML Schema validator and by the law oracle
 * (`#pantry/test/xsd-differential.ts`). It replaces the drawn differential that judged 240 drawn
 * documents once each: its seeds are those draws, its edits the named variants that differential
 * applied and more, and its selection keeps every document that showed a feature no earlier one
 * had.
 *
 * Oracle: a second implementation. `xmllint` shares no code with the grammar; a difference no
 * record of `#pantry/test/xsd-differential.ts` matches is a bug in one of the two, reported with
 * its document reduced by hierarchical delta debugging and the edits that bred it.
 *
 * Seeds are drawn whose roots `xmllint` judges: a root only an included fragment has (reading 114)
 * has no global declaration, so `xmllint` assesses nothing below it and the case compares nothing.
 * A seed holds no doctype and so no unexpanded entity reference, since an entity declared only in
 * an external subset no processor here reads leaves no infoset to compare.
 *
 * Budget: a bounded one in every free run, a longer one under `GR8DES_GENETIC=1`. The search's
 * seed is the run's (`TEST_SEED`); rerunning with it breeds the same documents. It writes the
 * documents under a folder of the run's own, `work/genetic-xsd-*`, removed after the file.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, describe, it as unit, layer } from "@effect/vitest";
import { Console, Effect, FileSystem, Layer, Option, Result } from "effect";
import { Digest } from "effect/crypto";
import { encode } from "@qti-pie/crust/encode.ts";
import { writeXml } from "@qti-pie/crust/write.ts";
import { floorSeed, rotatingSeed } from "@grizzle/testing/random";
import { sample } from "@grizzle/testing/source";
import { swarm } from "@grizzle/testing/swarm";
import { runOfProcess } from "@grizzle/testing/vitest/run";
import { composed } from "#pantry/grammar/compose.ts";
import type { ComposedGrammar } from "#pantry/grammar/compose.ts";
import { schemaVersions } from "#pantry/grammar/kinds.ts";
import type { SchemaVersion } from "#pantry/grammar/kinds.ts";
import { namesOf } from "#pantry/model/composed.ts";
import { toXmlDocument } from "#pantry/model/unshred.ts";
import { corpusFrom } from "#pantry/test/gen/genetic/corpus.ts";
import {
  documentOf,
  editedNamespaces,
  rowsOf,
  seedGenome,
  smallerXsd,
  xsdFamilyOf,
  xsdFeaturesOf,
  xsdMutationOf,
  xsdOperators,
} from "#pantry/test/gen/genetic/document-xsd.ts";
import type { XsdFeature, XsdGenome } from "#pantry/test/gen/genetic/document-xsd.ts";
import { evolve, reduce } from "#pantry/test/gen/genetic/engine.ts";
import type { Breeding } from "#pantry/test/gen/genetic/mutate.ts";
import type { Budget, Judgment } from "#pantry/test/gen/genetic/engine.ts";
import { xdmDocument } from "#pantry/test/gen/xdm.ts";
import { lawsOf } from "#pantry/test/oracle.ts";
import type { Laws } from "#pantry/test/oracle.ts";
import { fileScratchDirectory } from "#pantry/test/scratch.ts";
import { settings } from "#pantry/test/settings.ts";
import { compareJudgments, schemaSetOf, writeXsdOracle } from "#pantry/test/xsd-catalog.ts";
import type { Difference, XsdOracle } from "#pantry/test/xsd-catalog.ts";
import { liveReadings, stillSays } from "#pantry/test/live-readings.ts";
import {
  elementGrainDifferences,
  everyRecord,
  foreignNamesOf,
  fragmentOnlyKinds,
  generatedRecordOf,
  judgeDocument,
  reasonText,
  validated,
} from "#pantry/test/xsd-differential.ts";
import type { Recorded } from "#pantry/test/xsd-differential.ts";
import { checkCache } from "#pantry/vocab/derive/sources.ts";
import { OracleLayer } from "#pantry/xml/oracle.ts";

/**
 * Whether the XSD cache holds every pin, so `xmllint` can read them.
 */
const cached = await Effect.runPromise(
  checkCache().pipe(
    Effect.as(true),
    Effect.catchTag("XsdSourceMissing", () => Effect.succeed(false)),
    Effect.provide(NodeServices.layer),
  ),
);

/**
 * The services the test reads and spawns with.
 */
const TestLayer = Layer.mergeAll(
  NodeServices.layer,
  Digest.layerWebCrypto,
  OracleLayer.pipe(Layer.provide(NodeServices.layer)),
);

/**
 * The folder the bred documents are written to for `xmllint`, the run's own.
 */
const scratchRoot = fileScratchDirectory("genetic-xsd-");

/**
 * The folder the oracle's driver schemas and catalog are written to, the run's own.
 */
const oracleRoot = fileScratchDirectory("genetic-xsd-oracle-");

/**
 * The free run's budget: 64 seeds and two generations of 80, so `xmllint` compiles each version's
 * schema sets three times. To be set from a measurement.
 */
const freeBudget: Budget = { candidates: 160, edits: 3, generation: 80, initial: 64 };

/**
 * The long budget under `GR8DES_GENETIC=1`: 96 seeds and 25 generations of 96.
 */
const longBudget: Budget = { candidates: 2400, edits: 4, generation: 96, initial: 96 };

/**
 * The budget this run spends.
 */
const budget = settings.geneticRequested ? longBudget : freeBudget;

/**
 * The most reduction proposals one finding is judged on, how many go to `xmllint` at once, how many
 * findings are reduced, and until when in the test's run, in milliseconds from its start; the rest
 * are reported as bred. A batch is one `xmllint` process per schema set, so three batches reduce a
 * finding.
 */
const reduction = {
  batch: 60,
  findings: 8,
  tries: 180,
  until: settings.geneticRequested ? 6_000_000 : 420_000,
} as const;

/**
 * The timeout, in milliseconds: the grammar, the seeds, the generations' `xmllint` runs and law
 * judgments, and each finding's reduction. To be set from a measurement; 600 s until then for
 * the free budget, and two hours for the long one.
 */
const timeoutMs = settings.geneticRequested ? 7_200_000 : 600_000;

/**
 * One disagreement: a difference no record matches, in the version it was judged in.
 */
interface Disagreement {
  readonly difference: Difference;
  readonly version: SchemaVersion;
}

/**
 * Key a disagreement by its class: its direction, class and rule, and its detail with line
 * numbers, node indexes and quoted values left out, so one bug's documents share one key.
 *
 * @param disagreement - The disagreement.
 * @returns The key.
 */
const signatureOf = ({ difference }: Disagreement): string =>
  [
    difference.direction,
    difference.class,
    difference.rule,
    [
      ...new Set(
        difference.detail.split(" | ").map((message) =>
          message
            .replaceAll(/line \d+/gu, "line #")
            .replaceAll(/\[\d+\]/gu, "")
            .replaceAll(/'[^']*'/gu, "'…'")
            .replaceAll(/"(?:[^"\\]|\\.)*"/gu, '"…"'),
        ),
      ),
    ]
      .toSorted()
      .join(" | "),
  ].join(" ");

/**
 * Count, by its reason, each record the judged differences matched, for the report.
 */
const matchedCounts = new Map<string, number>();

/**
 * Judge documents in some versions with both oracles: each written once, `xmllint` run once per
 * version and root schema set, the law oracle on each document in each version, and every
 * difference classified.
 *
 * @param input - What to judge.
 * @param input.genomes - The documents.
 * @param input.grammar - The composed grammar.
 * @param input.laws - Its law tables.
 * @param input.oracle - What `writeXsdOracle` wrote.
 * @param input.versions - The versions each is judged in.
 * @param input.folder - The folder the documents are written to.
 * @returns One judgment per document, in order.
 */
const judgeAll = Effect.fn("test.geneticXsd.judgeAll")(function* judgeAll(input: {
  readonly folder: string;
  readonly genomes: readonly XsdGenome[];
  readonly grammar: ComposedGrammar;
  readonly laws: Laws;
  readonly oracle: XsdOracle;
  readonly versions: readonly SchemaVersion[];
}) {
  const fs = yield* FileSystem.FileSystem;
  yield* fs.makeDirectory(input.folder, { recursive: true });

  const written = yield* Effect.forEach(
    input.genomes,
    (genome, at) =>
      Effect.gen(function* writeCandidate() {
        const file = `${input.folder}/c${String(at)}.xml`;
        const bytes = yield* Effect.option(encode(documentOf(genome), "utf-8"));
        if (Option.isSome(bytes)) {
          yield* fs.writeFile(file, bytes.value);
        }

        return { bytes, file, genome };
      }),
    { concurrency: 1 },
  );
  const writable = written.flatMap(({ bytes, file, genome }) =>
    Option.isSome(bytes) ? [{ bytes: bytes.value, file, genome }] : [],
  );
  const verdicts = yield* Effect.forEach(
    input.versions,
    (version) =>
      writable.length === 0 ? Effect.succeed([]) : validated(input.oracle, version, writable),
    { concurrency: "unbounded" },
  );

  return yield* Effect.forEach(
    written,
    ({ bytes, file, genome }) =>
      Effect.gen(function* judgeCandidate() {
        if (Option.isNone(bytes)) {
          return {
            disagreements: [],
            features: new Set<XsdFeature>(["verdict:unwritable"]),
          } satisfies Judgment<XsdFeature, Disagreement>;
        }

        const slot = writable.findIndex((held) => held.file === file);
        const { root } = documentOf(genome);
        const edited = editedNamespaces(genome.seed, root);
        const features = new Set<XsdFeature>();
        const disagreements: Disagreement[] = [];
        for (const [index, version] of input.versions.entries()) {
          const xsd =
            verdicts[index]?.[slot] ?? (yield* Effect.die(new Error(`no verdict for ${file}`)));
          const law = yield* judgeDocument({
            bytes: bytes.value,
            grammar: input.grammar,
            laws: input.laws,
            path: file,
            version,
          });
          const comparison = compareJudgments(xsd, law);
          const differences = [
            ...comparison.differences,
            ...elementGrainDifferences(xsd, law, comparison, input.grammar),
          ];
          // The classes read the document's rows and schema set, which only a difference needs.
          if (differences.length > 0) {
            const names = yield* foreignNamesOf(bytes.value, version, input.grammar);
            const set = yield* schemaSetOf(version, root.namespace).pipe(
              Effect.orElseSucceed(() => new Set<string>()),
            );
            for (const difference of differences) {
              const record: Recorded | undefined = generatedRecordOf(difference, {
                document: { path: file, zip: "bred" },
                edited,
                grammar: input.grammar,
                names,
                root,
                set,
                stopped: law.stopped,
                version,
              });
              if (record === undefined) {
                disagreements.push({ difference, version });
              } else {
                const reason = reasonText(record.reason).slice(0, 60);
                matchedCounts.set(reason, (matchedCounts.get(reason) ?? 0) + 1);
              }
            }
          }

          for (const feature of xsdFeaturesOf({
            comparison,
            edits: genome.edits,
            law,
            rows: yield* rowsOf(bytes.value, version, input.grammar),
            version,
            xsd,
          })) {
            features.add(feature);
          }
        }

        return { disagreements, features } satisfies Judgment<XsdFeature, Disagreement>;
      }),
    { concurrency: 1 },
  );
});

/**
 * Write a document genome's document as a report shows it.
 *
 * @param genome - The genome.
 * @returns Its XML text, or `(unwritable)` where crust cannot write it.
 */
const shown = (genome: XsdGenome) =>
  Effect.map(Effect.result(writeXml(documentOf(genome))), (text) =>
    Result.getOrElse(text, () => "(unwritable)"),
  );

/**
 * Draw the seed documents: the XDM generator's, with no doctype and so no entity reference, and
 * rooted only at kinds whose roots `xmllint` judges, on the run's own stream, each with a swarm of
 * its own.
 *
 * @param grammar - The composed grammar.
 * @param stream - The run's stream.
 * @param count - How many seeds.
 * @returns The seeds.
 */
const seedsOf = (
  grammar: ComposedGrammar,
  stream: ReturnType<typeof rotatingSeed>,
  count: number,
): readonly XsdGenome[] => {
  const names = namesOf(grammar);
  const drawn = sample(
    xdmDocument(grammar, new Set(["doctype", "entityRef"]), (kind) => !fragmentOnlyKinds.has(kind)),
    stream,
    count,
  );
  const swarms = sample(swarm(xsdOperators), rotatingSeed(stream, floorSeed("swarm")), count);

  return drawn.map(({ document }, at) =>
    seedGenome(toXmlDocument(document, names), swarms[at] ?? {}),
  );
};

describe.skipIf(!cached)("genetic-xsd.oracle.test.ts", () => {
  layer(TestLayer, { excludeTestServices: true })("the grammar against xmllint, bred", (it) => {
    it.effect(
      "every bred document, in both versions, has one verdict from both but for the recorded classes",
      () =>
        Effect.gen(function* breedAgainstXmllint() {
          const grammar = yield* Effect.fromResult(composed()).pipe(Effect.orDie);
          const laws = lawsOf(grammar);
          const run = yield* runOfProcess;
          const stream = rotatingSeed(run.seed, floorSeed("pantry/genetic-xsd"));
          const seeds = seedsOf(grammar, stream, budget.initial);
          const oracle = yield* writeXsdOracle(oracleRoot);
          const breeding: Breeding = {
            corpus: corpusFrom(
              grammar,
              seeds.map(({ genome }, at) => ({ genome, name: `seed#${String(at)}` })),
            ),
            grammar,
            lastEdit: new WeakMap(),
            rewards: new Map(),
            swarm: {},
          };
          let generation = 0;
          let disagreeing = 0;
          const started = Date.now();
          const judge = (
            genomes: readonly XsdGenome[],
            versions: readonly SchemaVersion[] = schemaVersions,
          ) => {
            generation += 1;

            return judgeAll({
              folder: `${scratchRoot}/g${String(generation)}`,
              genomes,
              grammar,
              laws,
              oracle,
              versions,
            }).pipe(
              Effect.tap((judgments) => {
                disagreeing += judgments.filter(
                  ({ disagreements }) => disagreements.length > 0,
                ).length;

                return Console.log(
                  `genetic-xsd: round ${String(generation)}, ${String(genomes.length)} documents in ${versions.join(" and ")}, ${String(disagreeing)} disagreeing so far, ${String(Math.round((Date.now() - started) / 1000))} s`,
                );
              }),
            );
          };

          const evolved = yield* evolve(
            {
              familyOf: xsdFamilyOf,
              judge: (genomes) => judge(genomes),
              mutate: xsdMutationOf(breeding),
              seeds,
              signatureOf,
            },
            budget,
            stream,
          );

          const found = [...evolved.found];
          yield* Console.log(
            [
              `genetic-xsd: TEST_SEED=${String(run.seed)}, budget ${JSON.stringify(budget)}, ${String(evolved.evaluated)} documents judged in ${schemaVersions.join(" and ")}, population ${String(evolved.population)}, ${String(evolved.features.size)} features, ${String(evolved.found.size)} disagreement classes`,
              `  residual (Good–Turing f1/n) by family: ${evolved.residual.map(({ candidates, estimate, family, observed, singletons }) => `${family} ${String(singletons)}/${String(candidates)} = ${estimate.toFixed(3)} of ${String(observed)} seen`).join("; ")}`,
              `  recorded classes matched: ${[...matchedCounts].map(([reason, count]) => `${reason}… ${String(count)}`).join("; ")}`,
              ...found.map(([signature]) => `  class: ${signature.slice(0, 300)}`),
            ].join("\n"),
          );

          const reports: string[] = [];
          for (const [at, [signature, finding]] of found.entries()) {
            const { difference, version } = finding.disagreement;
            // Reduce while the test's budget allows, so every class is reported before its timeout.
            const reducing = at < reduction.findings && Date.now() - started < reduction.until;
            const reduced = yield* reduce(
              finding.genome,
              smallerXsd,
              (genomes) =>
                Effect.map(judge(genomes, [version]), (judgments) =>
                  judgments.map(({ disagreements }) =>
                    disagreements.some((held) => signatureOf(held) === signature),
                  ),
                ),
              reducing ? reduction.tries : 0,
              reduction.batch,
            );
            const report = [
              `${difference.direction} ${difference.class} ${difference.rule} in ${version}: ${difference.detail.slice(0, 600)}`,
              `  bred by: ${finding.lineage.join(" ; ") || "(a seed)"}`,
              `  ${reducing ? `reduced in ${String(reduced.tries)} tries` : "unreduced"} to: ${yield* shown(reduced.genome)}`,
            ].join("\n");
            reports.push(report);
            yield* Console.log(
              `genetic-xsd: finding ${String(at + 1)} of ${String(found.length)}\n${report}`,
            );
          }

          assert.deepStrictEqual(
            reports,
            [],
            "both oracles judge every bred document alike, but for the recorded classes",
          );
        }),
      { timeout: timeoutMs },
    );
  });
});

describe("genetic-xsd.oracle.test.ts, the records' readings", () => {
  layer(NodeServices.layer)("docs/spec-readings.md as it stands", (it) => {
    it.effect(
      "every record that cites a reading quotes a sentence the reading still says, so a withdrawn reading's record turns stale",
      () =>
        Effect.gen(function* recordsStillRead() {
          const readings = yield* liveReadings();
          const stale = everyRecord.flatMap(({ reason }) =>
            reason._tag === "reading" && !stillSays(readings, reason.reading, reason.says)
              ? [
                  `reading ${String(reason.reading)} no longer says "${reason.says}" (${reason.why})`,
                ]
              : [],
          );

          assert.deepStrictEqual(stale, [], "every record's reading still says what it cites");
        }),
    );
  });
});

describe("genetic-xsd.oracle.test.ts, reading 129's record", () => {
  unit(
    "holds for an xml:lang value RFC 5646 refuses, and never for a well-formed language tag",
    () => {
      const record = everyRecord.find(
        ({ reason }) => reason._tag === "reading" && reason.reading === 129,
      );
      const matches = (value: string): boolean =>
        record?.detail?.test(
          `value domain at /qti-assessment-stimulus: xml:lang: "${value}" is outside qti-assessment-item@xml:lang (reading 129), whose pattern is ^x$`,
        ) ?? false;
      // RFC 5646 section 2.1's Language-Tag, one of each production, and the nearest values the
      // RFC refuses.
      const wellFormed = [
        "en",
        "EN-us",
        "zh-Hant-TW",
        "sl-rozaj-biske",
        "de-CH-1901",
        "en-a-bbb-x-a-ccc",
        "x-whatever",
        "i-klingon",
        "zh-min-nan",
        " en ",
        "\\ten",
      ];
      const refused = [
        "",
        " ",
        "e",
        "en_US",
        "en-",
        "-en",
        "abcdefghi",
        "en-x",
        "en--us",
        "i-unknown",
      ];

      assert.deepStrictEqual(
        [...wellFormed.filter(matches), ...refused.filter((value) => !matches(value))],
        [],
        "the record matches exactly the values RFC 5646 refuses",
      );
    },
  );
});

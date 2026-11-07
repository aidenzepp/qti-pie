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
 * Seeds are rooted where `xmllint` judges: a root only an included fragment has (reading 114) has
 * no global declaration, so `xmllint` assesses nothing below it and the case compares nothing. The
 * lawful seeds come first (`#pantry/test/gen/genetic/lawful.ts`): documents built from the
 * grammar's content automata that both oracles should accept, each root model's accepting states
 * probed by a path stopped at each of its positions, and every position its models reach passed by
 * a covering document, so one edit of a lawful seed is the only cause of what it breaks, and a
 * lawful document the grammar refuses shows. The drawn seeds follow (the XDM generator's), lawful
 * in their content and attribute admission only. A seed holds no doctype and so no unexpanded
 * entity reference, since an entity declared only in an external subset no processor here reads
 * leaves no infoset to compare.
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
import { readXml } from "@qti-pie/crust/read.ts";
import type { Element } from "@qti-pie/crust/tree.ts";
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
import { lawfulDocuments } from "#pantry/test/gen/genetic/lawful.ts";
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
import { OracleLayer, xmllintValidate } from "#pantry/xml/oracle.ts";

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
 * The free run's budget: every lawful seed, 64 drawn seeds and two generations of 80, so `xmllint`
 * compiles each version's schema sets three times. `initial` counts the drawn seeds; the run judges
 * the lawful ones beside them.
 */
const freeBudget: Budget = { candidates: 160, edits: 3, generation: 80, initial: 64 };

/**
 * The long budget under `GR8DES_GENETIC=1`: every lawful seed, 96 drawn seeds and 25 generations of
 * 96.
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
 * judgments, and each finding's reduction. Measured 2026-11-07: 434.3 s at a load average of 68 to
 * 97, a free run that found two disagreement classes (TEST_SEED=2298271331) and reduced them up to
 * {@link reduction}'s 420 s. The free budget is twice that, rounded up to the next minute; the long
 * one is two hours.
 */
const timeoutMs = settings.geneticRequested ? 7_200_000 : 900_000;

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
 * A known disagreement: a defect a lane owns and whose fix is queued, recorded so main stays green
 * until the fix lands, and checked every run so the record cannot outlive it. The search reports a
 * difference it matches without failing; the kept documents must still show each one, or the
 * record is stale and fails; the owner's fix deletes the record in the same commit.
 */
interface Known {
  readonly class: Difference["class"];
  readonly detail: RegExp;
  readonly direction: Difference["direction"];
  /**
   * The lane whose queued commit fixes it, and where that commit stands in the queue.
   */
  readonly owner: string;
  readonly why: string;
}

/**
 * The known disagreements.
 */
const knownDisagreements: readonly Known[] = [
  {
    class: "content",
    detail:
      /^N6 ancestry at (?:(?!\/qti-template-block)\S)*\/qti-template-inline(?:\.rubric)?\[\d+\]\/\S+: \S+ sits in \{[^}]*\btmpl\b[^}]*\}: Banned holds \{[^}]*\btmpl\b/u,
    direction: "oracle-only",
    owner: "VD, schema slot 7",
    why: "VD's ruling of 2026-11-07: an interaction a template inline's HTML holds is valid, and only a template block refuses one at any depth (§5.145); the grammar bans it under every template (ancestry.ts interactionBans `tmpl`)",
  },
];

/**
 * Find the known disagreement a difference is.
 *
 * @param difference - The difference.
 * @returns The entry, or undefined for none.
 */
const knownOf = (difference: Difference): Known | undefined =>
  knownDisagreements.find(
    (entry) =>
      entry.direction === difference.direction &&
      entry.class === difference.class &&
      entry.detail.test(difference.detail),
  );

/**
 * Count, by its owner, each known disagreement the judged differences matched, for the report and
 * the stale check.
 */
const knownCounts = new Map<Known, number>();

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
          const rows = yield* rowsOf(bytes.value, version, input.grammar);
          // The law oracle names a foreign element by its foreign kind; the element grain reads
          // their expanded names from the rows' OpenElementName.
          const foreign = new Set(
            Option.match(rows, {
              onNone: () => [],
              onSome: ({ openElementNames }) =>
                openElementNames.map(({ local, namespace }) =>
                  namespace === "" ? local : `{${namespace}}${local}`,
                ),
            }),
          );
          const differences = [
            ...comparison.differences,
            ...elementGrainDifferences(xsd, law, comparison, input.grammar, foreign),
          ];
          // The classes read the document's names and schema set, which only a difference needs.
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
              const known = record === undefined ? knownOf(difference) : undefined;
              if (known !== undefined) {
                knownCounts.set(known, (knownCounts.get(known) ?? 0) + 1);
              } else if (record === undefined) {
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
            rows,
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
 * The documents every run judges as written, beside the bred ones: the reduced cases a ruling or a
 * record settled, each of which both oracles must judge alike from then on. The template inline's
 * is VD's ruling of 2026-11-07 (an interaction its HTML holds is valid; only a template block
 * refuses one at any depth, §5.145), which disagrees until the grammar's ban comes off the inline.
 * The padded `xsi:type`'s is libxml2's on both sides (`paddedTypeRecord`, `paddedTypeLaw`): a
 * lawful-seed run bred it from a drawn seed, `xsitype:ENTITY ` on a lax foreign element.
 */
const keptDocuments: readonly { readonly name: string; readonly text: string }[] = [
  {
    name: "an interaction in a template inline's span",
    text: '<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="i" title="t" time-dependent="false"><qti-response-declaration identifier="R" cardinality="single" base-type="string"/><qti-template-declaration identifier="T" cardinality="single" base-type="identifier"/><qti-item-body><p><qti-template-inline template-identifier="T" identifier="x"><span><qti-text-entry-interaction response-identifier="R"/></span></qti-template-inline></p></qti-item-body></qti-assessment-item>',
  },
  {
    name: "an xsi:type padded with a trailing space, on a foreign element a lax wildcard holds",
    text: '<qti-assessment-section xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-selection xmlns:n="urn:n"><config xmlns="urn:w" xmlns:o="urn:w"><widget xmlns:zs="http://www.w3.org/2001/XMLSchema-instance" xmlns="" xmlns:xsitype="http://www.w3.org/2001/XMLSchema" zs:type="xsitype:ENTITY "/></config></qti-selection></qti-assessment-section>',
  },
  {
    name: "an interaction in a template block's paragraph",
    text: '<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="i" title="t" time-dependent="false"><qti-response-declaration identifier="R" cardinality="single" base-type="string"/><qti-template-declaration identifier="T" cardinality="single" base-type="identifier"/><qti-item-body><qti-template-block template-identifier="T" identifier="x"><p><qti-text-entry-interaction response-identifier="R"/></p></qti-template-block></qti-item-body></qti-assessment-item>',
  },
];

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
 * Whether a root kind's documents are judged: `xmllint` judges every root but one only an included
 * fragment has (reading 114).
 *
 * @param kind - The root's kind.
 * @returns Whether its documents seed the search.
 */
const judgedRoot = (kind: string): boolean => !fragmentOnlyKinds.has(kind);

/**
 * The seeds of a run: the genomes, lawful first, and each one's name by the root of its document,
 * which a finding bred from it reads back through its genome's `seed`.
 */
interface Seeds {
  readonly names: ReadonlyMap<Element, string>;
  readonly seeds: readonly XsdGenome[];
}

/**
 * Build the seed documents, rooted only at kinds whose roots `xmllint` judges: every lawful
 * document, then `count` documents of the XDM generator's, with no doctype and so no entity
 * reference, drawn on the run's own stream; each with a swarm of its own, and named, a drawn one by
 * its place.
 *
 * @param grammar - The composed grammar.
 * @param stream - The run's stream.
 * @param count - How many drawn seeds.
 * @returns The seeds.
 */
const seedsOf = (
  grammar: ComposedGrammar,
  stream: ReturnType<typeof rotatingSeed>,
  count: number,
): Seeds => {
  const lawful = lawfulDocuments(grammar, judgedRoot);
  const drawn = sample(
    xdmDocument(grammar, new Set(["doctype", "entityRef"]), judgedRoot),
    stream,
    count,
  ).map(({ document }, at) => ({
    doc: toXmlDocument(document, namesOf(grammar)),
    name: `drawn #${String(at)}`,
  }));
  const named = [...lawful, ...drawn];
  const swarms = sample(
    swarm(xsdOperators),
    rotatingSeed(stream, floorSeed("swarm")),
    named.length,
  );
  const seeds = named.map(({ doc }, at) => seedGenome(doc, swarms[at] ?? {}));

  return {
    names: new Map(seeds.map(({ seed }, at) => [seed, named[at]?.name ?? ""])),
    seeds,
  };
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
          const { names: seedNames, seeds } = seedsOf(grammar, stream, budget.initial);
          const lawful = new Set(seeds.slice(0, seeds.length - budget.initial));
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
          const lawfulVerdicts = new Map<string, number>();
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
                for (const [at, { features }] of judgments.entries()) {
                  const genome = genomes[at];
                  for (const feature of genome !== undefined && lawful.has(genome)
                    ? features
                    : []) {
                    if (feature.startsWith("verdict:")) {
                      lawfulVerdicts.set(feature, (lawfulVerdicts.get(feature) ?? 0) + 1);
                    }
                  }
                }

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
            { ...budget, initial: seeds.length },
            stream,
          );

          const found = [...evolved.found];
          yield* Console.log(
            [
              `genetic-xsd: TEST_SEED=${String(run.seed)}, budget ${JSON.stringify(budget)} beside ${String(lawful.size)} lawful seeds, ${String(evolved.evaluated)} documents judged in ${schemaVersions.join(" and ")}, population ${String(evolved.population)}, ${String(evolved.features.size)} features, ${String(evolved.found.size)} disagreement classes`,
              `  lawful seeds' verdicts: ${[...lawfulVerdicts].map(([verdict, count]) => `${verdict.slice("verdict:".length)} ${String(count)}`).join("; ")}`,
              `  residual (Good–Turing f1/n) by family: ${evolved.residual.map(({ candidates, estimate, family, observed, singletons }) => `${family} ${String(singletons)}/${String(candidates)} = ${estimate.toFixed(3)} of ${String(observed)} seen`).join("; ")}`,
              `  recorded classes matched: ${[...matchedCounts].map(([reason, count]) => `${reason}… ${String(count)}`).join("; ")}`,
              ...found.map(([signature]) => `  class: ${signature.slice(0, 300)}`),
            ].join("\n"),
          );

          const kept = yield* Effect.forEach(
            keptDocuments,
            ({ text }) =>
              Effect.map(Effect.orDie(readXml(new TextEncoder().encode(text))), (doc) =>
                seedGenome(doc, {}),
              ),
            { concurrency: 1 },
          );
          // The kept documents run last, so the counts that follow are theirs alone.
          knownCounts.clear();

          const keptJudgments = yield* judge(kept);
          const reports: string[] = [
            ...keptJudgments.flatMap(({ disagreements }, at) =>
              disagreements.map(
                ({ difference, version }) =>
                  `kept document "${keptDocuments[at]?.name ?? ""}" in ${version}: ${difference.direction} ${difference.class} ${difference.rule}: ${difference.detail.slice(0, 400)}`,
              ),
            ),
            ...knownDisagreements.flatMap((entry) =>
              (knownCounts.get(entry) ?? 0) === 0
                ? [
                    `known disagreement of ${entry.owner} is stale: no kept document shows it any more, so its fix has landed and the record goes (${entry.why})`,
                  ]
                : [],
            ),
          ];
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
              `  bred from ${seedNames.get(finding.genome.seed) ?? "a seed"} by: ${finding.lineage.join(" ; ") || "(no edit)"}`,
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
    "holds for a language value RFC 5646 refuses, as each attribute and element reads it, and never for one it admits",
    () => {
      const record = everyRecord.find(
        ({ reason }) => reason._tag === "reading" && reason.reading === 129,
      );
      const matches = ([place, attribute, value]: readonly [string, string, string]): boolean =>
        record?.detail?.test(
          `value domain at /${place}: ${attribute}: "${value}" is outside qti-assessment-item@xml:lang (reading 129) (2), whose pattern is ^x$`,
        ) ?? false;
      // RFC 5646 section 2.1's Language-Tag, one of each production; the empty value where the
      // attribute admits it; and the nearest values the RFC or the reading refuses.
      const tags = [
        "en",
        "EN-us",
        "zh-Hant-TW",
        "sl-rozaj-biske",
        "de-CH-1901",
        "en-a-bbb-x-a-ccc",
        "x-whatever",
        "i-klingon",
        "zh-min-nan",
      ];
      const admitted: readonly (readonly [string, string, string])[] = [
        ...tags.flatMap((tag) => [
          ["qti-assessment-item", "xml:lang", tag] as const,
          ["p", "xml:lang", tag] as const,
          ["track", "srclang", tag] as const,
          ["p", "lang", tag] as const,
        ]),
        ["qti-assessment-stimulus", "xml:lang", " en "],
        ["p", "xml:lang", "\\ten"],
        ["p", "xml:lang", ""],
        ["p", "lang", ""],
      ];
      const refused: readonly (readonly [string, string, string])[] = [
        ...["e", "en_US", "en-", "-en", "abcdefghi", "en-x", "en--us", "i-unknown"].flatMap(
          (value) => [
            ["qti-assessment-item", "xml:lang", value] as const,
            ["p", "xml:lang", value] as const,
            ["track", "srclang", value] as const,
            ["p", "lang", value] as const,
          ],
        ),
        ["qti-assessment-item", "xml:lang", ""],
        ["qti-assessment-stimulus", "xml:lang", " "],
        ["track", "srclang", ""],
        ["track", "srclang", "en "],
        ["p", "lang", "en "],
      ];

      assert.deepStrictEqual(
        [...admitted.filter(matches), ...refused.filter((held) => !matches(held))],
        [],
        "the record matches exactly the values reading 129 refuses",
      );
    },
  );
});

/**
 * The libxml2 control's toy schema: an attribute group G of an `##other` lax wildcard, referenced
 * by a type of its own and, when `derived`, by a type that extends a base whose wildcard is
 * `##any`.
 *
 * @param derived - Whether the extending type references G too.
 * @returns The schema's text.
 */
const widenedSchema = (derived: boolean): string =>
  [
    '<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" targetNamespace="urn:t" xmlns="urn:t" elementFormDefault="qualified">',
    '<xs:attributeGroup name="G"><xs:anyAttribute namespace="##other" processContents="lax"/></xs:attributeGroup>',
    '<xs:attributeGroup name="H"><xs:anyAttribute namespace="##any" processContents="lax"/></xs:attributeGroup>',
    '<xs:complexType name="Base"><xs:attributeGroup ref="H"/></xs:complexType>',
    ...(derived
      ? [
          '<xs:complexType name="Derived"><xs:complexContent><xs:extension base="Base"><xs:attributeGroup ref="G"/></xs:extension></xs:complexContent></xs:complexType>',
          '<xs:element name="derived" type="Derived"/>',
        ]
      : []),
    '<xs:complexType name="Plain"><xs:attributeGroup ref="G"/></xs:complexType>',
    '<xs:element name="plain" type="Plain"/>',
    "</xs:schema>",
  ].join("\n");

/**
 * The folder the libxml2 controls write their toy schemas to, the run's own.
 */
const controlRoot = fileScratchDirectory("genetic-xsd-control-");

/**
 * The padded-type control's toy schema: an element whose content is an `##other` lax wildcard.
 */
const laxSchema = [
  '<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" targetNamespace="urn:t" xmlns="urn:t" elementFormDefault="qualified">',
  '<xs:element name="w"><xs:complexType><xs:sequence><xs:any namespace="##other" processContents="lax" minOccurs="0" maxOccurs="unbounded"/></xs:sequence></xs:complexType></xs:element>',
  "</xs:schema>",
].join("\n");

/**
 * The padded-type control's document: a foreign element in no namespace, inside a foreign element
 * the lax wildcard holds, naming a built-in type by `xsi:type` and holding a text it refuses.
 *
 * @param type - The `xsi:type` value, `xs:` bound to XML Schema's namespace.
 * @returns The document's text.
 */
const laxTyped = (type: string): string =>
  `<w xmlns="urn:t"><config xmlns="urn:w"><widget xmlns="" xmlns:zs="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema" zs:type="${type}">a b</widget></config></w>`;

describe.skipIf(!cached)("genetic-xsd.oracle.test.ts, libxml2's padded xsi:type", () => {
  layer(TestLayer, { excludeTestServices: true })("the control", (it) => {
    it.effect(
      "a built-in type named with a trailing space resolves to no type, so the text it refuses is never assessed, and named plain refuses it",
      () =>
        Effect.gen(function* paddedType() {
          const fs = yield* FileSystem.FileSystem;
          const types = ["xs:ENTITY", "xs:ENTITY ", "xs:NCName", "xs:NCName "];

          yield* fs.makeDirectory(controlRoot, { recursive: true });
          yield* fs.writeFileString(`${controlRoot}/lax.xsd`, laxSchema);
          yield* Effect.forEach(
            types,
            (type, at) =>
              fs.writeFileString(`${controlRoot}/typed${String(at)}.xml`, laxTyped(type)),
            { concurrency: 1 },
          );

          const verdicts = yield* xmllintValidate({
            paths: types.map((_, at) => `${controlRoot}/typed${String(at)}.xml`),
            schema: `${controlRoot}/lax.xsd`,
          });

          assert.deepStrictEqual(
            verdicts.map((verdict) =>
              verdict._tag === "Invalid"
                ? verdict.messages.map(({ text }) => {
                    if (
                      text.endsWith(
                        "of the xsi:type attribute does not resolve to a type definition.",
                      )
                    ) {
                      return "no type";
                    }

                    return text.includes("is not a valid value of the atomic type")
                      ? "text refused"
                      : text;
                  })
                : [],
            ),
            [["text refused"], ["no type"], ["text refused"], ["no type"]],
            "libxml2 resolves a padded xsi:type's QName uncollapsed, and so assesses the element by no type",
          );
        }),
      { timeout: 120_000 },
    );
  });
});

describe.skipIf(!cached)("genetic-xsd.oracle.test.ts, libxml2's widened ##other", () => {
  layer(TestLayer, { excludeTestServices: true })("the control", (it) => {
    it.effect(
      "an attribute group's ##other admits an attribute in no namespace once a type extending an ##any base references the group, and not alone",
      () =>
        Effect.gen(function* widenedOther() {
          const fs = yield* FileSystem.FileSystem;

          yield* fs.makeDirectory(controlRoot, { recursive: true });
          yield* fs.writeFileString(`${controlRoot}/widened.xsd`, widenedSchema(true));
          yield* fs.writeFileString(`${controlRoot}/alone.xsd`, widenedSchema(false));
          yield* fs.writeFileString(`${controlRoot}/plain.xml`, '<plain xmlns="urn:t" zz="1"/>');

          const verdicts = yield* Effect.forEach(
            ["widened", "alone"],
            (name) =>
              xmllintValidate({
                paths: [`${controlRoot}/plain.xml`],
                schema: `${controlRoot}/${name}.xsd`,
              }),
            { concurrency: 1 },
          );

          assert.deepStrictEqual(
            verdicts.map((held) => held.map(({ _tag }) => _tag)),
            [["Valid"], ["Invalid"]],
            "libxml2 admits the no-namespace attribute only where a derived type shares the group",
          );
        }),
      { timeout: 120_000 },
    );
  });
});

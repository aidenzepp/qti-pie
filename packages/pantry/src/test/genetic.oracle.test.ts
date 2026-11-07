/**
 * The genetic differential: a feature-guided genetic search for every disagreement between the
 * law oracle (`#pantry/test/oracle.ts`, the independent implementation) and the import's host path
 * (`#pantry/import/program.ts` `readProgram`: its refusal, or the rows it builds, held to the laws
 * the schema states on the host), with no database (`#pantry/test/gen/genetic/`).
 *
 * The free suite replays; `GR8DES_GENETIC=1` explores. A search whose path moves with every
 * commit to the import, the oracle or the grammar would turn the free suite red where nothing it
 * holds changed, so the free suite judges only kept packages, each the same on every run:
 *
 * - Each known entry's package (`#pantry/test/gen/genetic/known.ts`) must still show its class, so an
 *   entry its owner's fix closed fails as stale until the fix's commit deletes it, and each fixed
 *   entry's must never show its class again;
 * - Each known and fixed entry's signature names only relations and fields `Qti` has, since one that
 *   names a relation or a field a later commit removed can never show, and a fixed entry keyed by
 *   it guards nothing;
 * - Each planted value-domain case (`#pantry/test/gen/genetic/planted.ts`) lies inside its domain's
 *   lexical space and outside its facets, which the oracle refuses and today's database does not,
 *   so the two disagree on it while it waits on its owner's fix, and must agree on it once the fix
 *   lands.
 *
 * The exploration is the genetic loop, one case per run: its swarm over the edit operators and its
 * seed are the case's draw, so its replay token replays the run. A run judges seeds drawn from the
 * corpus (the every-relation package, R87's assembly packages and the packaging fixtures), then
 * breeds candidates from parents picked by novelty over the features both sides show (law ×
 * element kind × document root on the oracle's side, rule × stage on the import's), each by
 * structural edits, crossover and named faults. Every class of disagreement it meets that no known
 * entry records is reduced to its smallest package and reported, all of them in one failure; each
 * becomes a known entry, its reduced package kept, with the lane that owns its fix. After the last
 * run, the Good–Turing residual of each feature family over the rotating runs is printed: residual
 * risk of the generator and its features, never proof.
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
import { Qti } from "#pantry/qti/schema.ts";
import { lawTable } from "#pantry/vocab/laws.ts";
import { corpusOf } from "#pantry/test/gen/genetic/corpus.ts";
import { residualsOf } from "#pantry/test/gen/genetic/engine.ts";
import type { Budget } from "#pantry/test/gen/genetic/engine.ts";
import { genomeOf } from "#pantry/test/gen/genetic/genome.ts";
import {
  familyOf,
  judgeOne,
  shownDisagreement,
  signatureOf,
} from "#pantry/test/gen/genetic/judge.ts";
import { fixed, known, knownEntries } from "#pantry/test/gen/genetic/known.ts";
import type { Known } from "#pantry/test/gen/genetic/known.ts";
import { plantedCases } from "#pantry/test/gen/genetic/planted.ts";
import type { Feature } from "#pantry/test/gen/genetic/judge.ts";
import {
  hunt,
  runLiteral,
  runSketch,
  shownReport,
  shownResidual,
} from "#pantry/test/gen/genetic/search.ts";
import type { Isolating } from "#pantry/test/gen/genetic/search.ts";
import { lawsOf } from "#pantry/test/oracle.ts";
import { scratchDirectory } from "#pantry/test/scratch.ts";
import { settings } from "#pantry/test/settings.ts";

/**
 * The timeout, in milliseconds, that this file's slower tests state, each itself or through its
 * describe: a hang guard, never a budget. Measured 2026-11-07: 51 s at a load average of 68 to 108,
 * its slowest test.
 */
const testTimeoutMs = 600_000;

/**
 * The timeout, in milliseconds, of the search that runs only under `GR8DES_GENETIC=1`: the long
 * budget's hang guard, measured by the long run, not the free one.
 */
const longTimeoutMs = 3_600_000;

/**
 * The oracle's law tables over the installed grammar, which the importer reads.
 */
const laws = lawsOf(grammar);

/**
 * The exploration's budget, which `GR8DES_GENETIC=1` runs: `runs` is the rotating stream's runs
 * (the floor stream runs a quarter as many), `budget` each run's, `isolating` its isolation
 * phase's, and `tries` each reduction's.
 */
const chosen = {
  budget: { candidates: 600, edits: 4, generation: 1, initial: 12 },
  isolating: { laws: 200, tries: 60 },
  runs: 8,
  tries: 400,
} as const satisfies {
  readonly budget: Budget;
  readonly isolating: Isolating;
  readonly runs: number;
  readonly tries: number;
};

/**
 * The known entries, which must still show their class, then the fixed ones, which must not.
 */
const knownList = [
  ...Object.entries<Known>(known).map(([signature, entry]) => ({ entry, shows: true, signature })),
  ...Object.entries<Known>(fixed).map(([signature, entry]) => ({ entry, shows: false, signature })),
];

/**
 * Each relation of `Qti`, and each field of its heading as `Relation.field`, the names a signature
 * may hold.
 */
const qtiNames: ReadonlySet<string> = new Set(
  Object.values(Qti.relations).flatMap(({ heading, name }) => [
    name,
    ...Object.keys(heading).map((field) => `${name}.${field}`),
  ]),
);

/**
 * A `Relation.field` in a signature: a dangling uuid's field, a field a key text is past its bound
 * in, or a fold's family.
 */
const fieldPattern = /\b[A-Z]\w*\.\w+/gu;

/**
 * A check's relation in a signature: `check <name> on Relation`.
 */
const checkPattern = /\bcheck \w+ on [A-Z]\w*/gu;

/**
 * A side of a containment or a fold in a signature: `Relation(term, ...)`, each term a field,
 * `pred(field)` or `constant(value)`, as `#pantry/test/key-copies.ts` `identityOf` writes it.
 */
const sidePattern = /\b[A-Z]\w*\((?:[^()]|\([^()]*\))*\)/gu;

/**
 * Read the relations and fields a side of a containment or a fold names: its relation, and each
 * term's field as `Relation.field`, a constant naming none.
 *
 * @param side - The side, as {@link sidePattern} matches it.
 * @returns The names.
 */
const sideNames = (side: string): readonly string[] => {
  const open = side.indexOf("(");
  const relation = side.slice(0, open);

  return [
    relation,
    ...side
      .slice(open + 1, -1)
      .split(", ")
      .flatMap((term) => {
        if (term.startsWith("constant(")) {
          return [];
        }

        return [`${relation}.${term.startsWith("pred(") ? term.slice("pred(".length, -1) : term}`];
      }),
  ];
};

/**
 * Read the relations and fields a signature names, as `#pantry/test/gen/genetic/judge.ts`
 * `signatureOf` writes them from the host's witnesses: each `Relation.field`, each check's
 * relation and each side of a containment or a fold with its terms' fields. A signature of a law's
 * name, a rule or a refusal names none.
 *
 * @param signature - The signature.
 * @returns The names, each once.
 */
const namedIn = (signature: string): ReadonlySet<string> =>
  new Set([
    ...Array.from(signature.matchAll(fieldPattern), ([named]) => named),
    ...Array.from(signature.matchAll(checkPattern), ([named]) =>
      named.slice(named.lastIndexOf(" ") + 1),
    ),
    ...Array.from(signature.matchAll(sidePattern), ([side]) => sideNames(side)).flat(),
  ]);

/**
 * Read the names a signature holds that `Qti` has no relation or field of.
 *
 * @param signature - The signature.
 * @returns Each such name.
 */
const goneIn = (signature: string): readonly string[] =>
  [...namedIn(signature)].filter((name) => !qtiNames.has(name));

/**
 * Signatures this file once kept, each naming a relation or a field `Qti` no longer has, one of
 * each shape {@link namedIn} reads, with the name gone: the guard below must refuse each.
 */
const goneSignatures = [
  ["dangling-uuid: VariableRef.declaration", "VariableRef.declaration"],
  ["import-only-law: Key text bound, a text past Node.stringPiece's bound", "Node.stringPiece"],
  [
    "import-only-law: E1 derived, contained Attribute(node, lexical) in AssessmentObject(node, identifierLexical)",
    "AssessmentObject.identifierLexical",
  ],
  [
    "import-only-law: E1 derived, contained Expression(parent, baseType, cardinality) in VariableRef(node, heldBase, heldCardinality)",
    "VariableRef.heldBase",
  ],
  ["import-only-law: E1 derived, check E1_derived on MappingSource", "MappingSource"],
] as const;

/**
 * The signatures the known entries record, which the search reports unreduced and does not fail on.
 */
const recorded: ReadonlySet<string> = new Set(Object.keys(known));

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
  if (!settings.geneticRequested) {
    return;
  }

  const never = Object.keys(lawTable).filter((law) => !isolation.raised.has(law));
  const together = [...isolation.raised.keys()]
    .filter((law) => !isolation.alone.has(law))
    .map(
      (law) =>
        `${law} (${String(isolation.raised.get(law) ?? 0)} raised, always beside ${[...(isolation.beside.get(law) ?? [])].join(", ") || "no one law"})`,
    );
  const lines = residualsOf(acrossRuns, rotatingRuns, familyOf).map(
    ({ estimate, family, observed, singletons }) =>
      `${family}: ${String(singletons)} of ${String(observed)} features in one run of ${String(rotatingRuns)}, Good–Turing ${estimate.toFixed(3)}`,
  );
  console.log(
    `genetic differential, laws broken alone: ${String(isolation.alone.size)} of ${String(Object.keys(lawTable).length)} stated\nraised, never alone: ${together.join("; ") || "none"}\nnever raised: ${never.join(", ") || "none"}`,
  );
  console.log(`genetic differential, residual risk over the rotating runs:\n${lines.join("\n")}`);
});

layer(NodeServices.layer, { excludeTestServices: true })(
  "the genetic differential of the import's host path and the law oracle",
  (it) => {
    it.effect(
      "still shows every known disagreement, and no fixed one",
      (ctx) =>
        // Oracle: a second implementation, the law oracle, against readProgram's refusal and the
        // laws its rows hold on the host. Bound: each known and fixed entry's package, judged once.
        searched(
          ctx,
          Effect.gen(function* knownRuns() {
            const directory = yield* scratchDirectory("genetic-known-");
            const bench = { directory, grammar, laws };

            return yield* exhaust(
              {
                box: "every known and fixed disagreement's package",
                caseHang: Duration.minutes(5),
                coverage: noCoverage,
                generator: int(0, knownList.length - 1),
                limit: knownList.length,
                literal: (at) => knownList[at]?.signature ?? String(at),
                oracle: {
                  kind: "second-implementation",
                  name: "the law oracle against readProgram's refusal and its rows' host laws",
                },
                suite: "pantry/genetic-known",
              },
              (at) =>
                Effect.gen(function* knownCase() {
                  const held = knownList[at];
                  assert.isDefined(held, `no known entry ${String(at)}`);
                  if (held !== undefined) {
                    const { entry, shows, signature } = held;
                    const judged = yield* judgeOne(yield* genomeOf(knownEntries(entry)), bench, at);
                    const signatures = judged.disagreements.map(signatureOf);
                    if (shows) {
                      assert.include(
                        signatures,
                        signature,
                        `stale: ${signature} no longer shows, which waits on ${entry.owner}'s fix (${entry.fix}); delete its entry from #pantry/test/gen/genetic/known.ts in the fix's commit, or move it to fixed`,
                      );
                    } else {
                      assert.notInclude(
                        signatures,
                        signature,
                        `${signature} shows again, which ${entry.owner}'s fix (${entry.fix}) closed`,
                      );
                    }
                  }
                }),
            );
          }).pipe(Effect.scoped),
        ),
      testTimeoutMs,
    );

    it.effect("names only relations and fields Qti has in every known and fixed signature", () =>
      // Oracle: Qti's own relations and their fields. Bound: every known and fixed entry's
      // signature, and one signature of each shape whose name Qti no longer has.
      Effect.sync(() => {
        for (const [signature, gone] of goneSignatures) {
          assert.include(goneIn(signature), gone, `the guard reads no ${gone} in ${signature}`);
        }

        assert.deepStrictEqual(
          knownList.flatMap(({ signature }) =>
            goneIn(signature).map((name) => `${signature}: ${name}`),
          ),
          [],
          "these signatures name a relation or a field Qti no longer has, so they can never show and their entries guard nothing; plant the behaviour each entry's fix removed, judge its package, and rekey it to the signature that shows, or delete it where none can",
        );
      }),
    );

    it.effect(
      "disagrees on each planted value outside its domain's facets exactly while it waits on a fix",
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
                    const sides = `the oracle says ${judged.summary.oracle}, the import's rows ${judged.summary.import}`;
                    if (Option.isSome(planted.waits)) {
                      const { fix, owner } = planted.waits.value;
                      assert.isNotEmpty(
                        domains,
                        `stale: ${planted.name} no longer disagrees, which waits on ${owner}'s fix (${fix}); drop its wait in #pantry/test/gen/genetic/planted.ts in the fix's commit (${sides})`,
                      );
                    } else {
                      assert.deepStrictEqual(
                        domains.map(shownDisagreement),
                        [],
                        `${planted.name}: ${sides}`,
                      );
                    }
                  }
                }),
            );
          }).pipe(Effect.scoped),
        ),
      testTimeoutMs,
    );

    it.effect.skipIf(!settings.geneticRequested)(
      "breeds no package the two judge differently, but as known",
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
                  const report = yield* hunt(
                    corpus,
                    bench,
                    chosen.budget,
                    chosen.tries,
                    recorded,
                    sketch,
                    chosen.isolating,
                  );
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

                  const unrecorded = report.reduced.filter(
                    ({ signature }) => !recorded.has(signature),
                  );
                  console.log(
                    `genetic run ${runLiteral(sketch)}: ${shownResidual(report)}; ${String(report.reduced.length - unrecorded.length)} known classes met`,
                  );
                  assert.deepStrictEqual(
                    unrecorded.map(({ signature }) => signature),
                    [],
                    `the import's host path and the law oracle disagree in classes no known entry records:\n\n${shownReport({ ...report, reduced: unrecorded })}`,
                  );
                }),
            );
          }).pipe(Effect.scoped),
        ),
      longTimeoutMs,
    );
  },
);

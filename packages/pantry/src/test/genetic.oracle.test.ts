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
 *   entry's must never show its class again, under its plain signature or under any stated limit;
 *   an entry that names a noise is judged beside its package's noised twin, as the search judges
 *   it, since a noise's class shows only there;
 * - No signature is a class of both tables: a known class whose plain signature is a fixed entry's is
 *   keyed by the stated limit it falls under (`#pantry/test/gen/genetic/judge.ts` `limitOf`), so
 *   the fixed entry keeps guarding the cause it closed;
 * - Each known and fixed entry's signature is a class some package can show: a law the host judges
 *   (grizzle's `sameLaw` holds it one of them, its selections included), or a uuid field it holds
 *   to the mint, since a law no statement states, or a field a later commit removed, can never
 *   show, and a fixed entry keyed by it guards nothing;
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
import { sameLaw } from "@bjornpagen/grizzle";
import { grammar } from "#pantry/grammar/install.ts";
import { lawTable } from "#pantry/vocab/laws.ts";
import { corpusOf } from "#pantry/test/gen/genetic/corpus.ts";
import { residualsOf } from "#pantry/test/gen/genetic/engine.ts";
import type { Budget } from "#pantry/test/gen/genetic/engine.ts";
import { genomeOf } from "#pantry/test/gen/genetic/genome.ts";
import { judgedLaws, uuidFields } from "#pantry/test/gen/genetic/host-laws.ts";
import { noised } from "#pantry/test/gen/genetic/noise.ts";
import {
  familyOf,
  judgeOne,
  movedBy,
  recordsClassOf,
  recordsPlainClassOf,
  sameSignature,
  shownDisagreement,
  shownSignature,
} from "#pantry/test/gen/genetic/judge.ts";
import type { Feature, Signature } from "#pantry/test/gen/genetic/judge.ts";
import { fixed, known, knownEntries } from "#pantry/test/gen/genetic/known.ts";
import { plantedCases } from "#pantry/test/gen/genetic/planted.ts";
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
  ...known.map((entry) => ({ entry, shows: true })),
  ...fixed.map((entry) => ({ entry, shows: false })),
];

/**
 * A manifest whose one resource holds `child`, which the import's rows bound only where the
 * database fills `Attribute.idrefText` from it.
 *
 * @param child - The resource's child element.
 * @returns The manifest's text.
 */
const filledManifest = (child: string): string =>
  `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" xmlns:cpx="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_extensionv1p2"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource>${child}</resource></resources></manifest>`;

/**
 * An NCName of `bytes` ASCII bytes.
 *
 * @param bytes - Its length in bytes.
 * @returns The name.
 */
const nameOf = (bytes: number): string => `K${"x".repeat(bytes - 1)}`;

/**
 * The manifests whose identifierref the database's fold copies into `Attribute.idrefText`, a field
 * the import never writes: one byte past the key-text bound (`keyTextBytes`, 2,587) on a cp:variant
 * and on a cp:dependency, and at the bound on the variant.
 */
const filledCases = [
  {
    manifest: filledManifest(`<cpx:variant identifierref="${nameOf(2588)}"/>`),
    name: "a cp:variant's identifierref past the bound",
  },
  {
    manifest: filledManifest(`<dependency identifierref="${nameOf(2588)}"/>`),
    name: "a cp:dependency's identifierref past the bound",
  },
  {
    manifest: filledManifest(`<cpx:variant identifierref="${nameOf(2587)}"/>`),
    name: "a cp:variant's identifierref at the bound",
  },
] as const;

/**
 * The class no filled case may show: the oracle finding a key text past its bound that the import's
 * rows hold.
 */
const keyTextBound: Signature = { kind: "oracle-only-law", law: "Key text bound" };

/**
 * Whether some package can show a signature's class: for a law the rows break, a law the host
 * judges, which grizzle's `sameLaw` holds one of {@link judgedLaws}, its selections included; for
 * a dangling uuid, a uuid field the host holds to the mint. Any other class names a law by its
 * name, which the type keeps to the law table, or a rule or a noise, which nothing removes.
 *
 * @param signature - The signature.
 * @returns Whether it can show.
 */
const canShow = (signature: Signature): boolean => {
  switch (signature.kind) {
    case "import-only-law": {
      return judgedLaws.some(
        (law) => law.kind === signature.law.kind && sameLaw(law, signature.law),
      );
    }
    case "dangling-uuid": {
      return Option.exists(Option.fromUndefinedOr(uuidFields.get(signature.relation)), (fields) =>
        fields.includes(signature.field),
      );
    }
    case "codec-import-only":
    case "codec-oracle-only":
    case "codec-rule":
    case "import-died":
    case "lone-refusal":
    case "noise-moved":
    case "oracle-died":
    case "oracle-only-law": {
      return true;
    }
    default: {
      return signature satisfies never;
    }
  }
};

/**
 * Signatures that no package can show, one of each shape {@link canShow} reads: four this file once
 * kept, each naming a relation or a field `Qti` no longer has, and the containment of a
 * declaration's cardinality in its attribute with its selections dropped, which the text keys this
 * file once held wrote for two laws `Qti` states, its `base-type` and its `cardinality`
 * attribute's, and no law of `Qti` is: the guard below must refuse each.
 */
const unshowable: readonly Signature[] = [
  { field: "declaration", kind: "dangling-uuid", relation: "VariableRef" },
  {
    kind: "import-only-law",
    law: { kind: "check", name: "E1_derived", relation: "MappingSource" },
  },
  {
    kind: "import-only-law",
    law: {
      field: "stringPiece",
      kind: "pattern",
      patterns: [{ flags: "u", source: "^[\\s\\S]*$" }],
      relation: "Node",
    },
  },
  {
    kind: "import-only-law",
    law: {
      from: {
        relation: "Attribute",
        selection: { conjuncts: [] },
        terms: [
          { field: "node", kind: "field" },
          { field: "lexical", kind: "field" },
        ],
      },
      kind: "contained",
      to: {
        relation: "AssessmentObject",
        selection: { conjuncts: [] },
        terms: [
          { field: "node", kind: "field" },
          { field: "identifierLexical", kind: "field" },
        ],
      },
    },
  },
  {
    kind: "import-only-law",
    law: {
      from: {
        relation: "DeclarationCardinality",
        selection: { conjuncts: [] },
        terms: [{ field: "node", kind: "field" }],
      },
      kind: "contained",
      to: {
        relation: "Attribute",
        selection: { conjuncts: [] },
        terms: [{ field: "node", kind: "field" }],
      },
    },
  },
];

/**
 * The classes the known entries record, which the search reports unreduced and does not fail on.
 */
const recorded: readonly Signature[] = known.map(({ signature }) => signature);

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
        // laws its rows hold on the host. Bound: each known and fixed entry's package, judged once,
        // and beside its noised twin where the entry names a noise.
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
                literal: (at) => {
                  const held = knownList[at];

                  return held === undefined ? String(at) : shownSignature(held.entry.signature);
                },
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
                    const { entry, shows } = held;
                    const genome = yield* genomeOf(knownEntries(entry));
                    const judged = yield* judgeOne(genome, bench, at);
                    const moved =
                      entry.noised === undefined
                        ? []
                        : movedBy(
                            judged,
                            yield* judgeOne(
                              noised(genome, entry.noised.noise, entry.noised.salt),
                              bench,
                              at,
                            ),
                            entry.noised.noise,
                            entry.noised.salt,
                          );
                    const disagreements = [...judged.disagreements, ...moved];
                    const signature = shownSignature(entry.signature);
                    const shown = disagreements.map(shownDisagreement).join("; ") || "none";
                    // A known class shows as it is keyed; a fixed one must not show again, under its
                    // plain signature or under any stated limit.
                    assert.strictEqual(
                      disagreements.some((disagreement) =>
                        shows
                          ? recordsClassOf([entry.signature], disagreement)
                          : recordsPlainClassOf([entry.signature], disagreement),
                      ),
                      shows,
                      shows
                        ? `stale: ${signature} no longer shows, which waits on ${entry.owner}'s fix (${entry.fix}); delete its entry from #pantry/test/gen/genetic/known.ts in the fix's commit, or move it to fixed (its package shows ${shown})`
                        : `${signature} shows again, which ${entry.owner}'s fix (${entry.fix}) closed (its package shows ${shown})`,
                    );
                  }
                }),
            );
          }).pipe(Effect.scoped),
        ),
      testTimeoutMs,
    );

    it.effect(
      "flags no key text past its bound in a field the database fills",
      (ctx) =>
        // Oracle: a second implementation, the law oracle, against the laws the import's rows hold
        // on the host. Bound: a cp:variant's and a cp:dependency's identifierref one byte past the
        // key-text bound, and the variant's at the bound, each judged once.
        searched(
          ctx,
          Effect.gen(function* filledRuns() {
            const directory = yield* scratchDirectory("genetic-filled-");
            const bench = { directory, grammar, laws };

            return yield* exhaust(
              {
                box: "an identifierref one byte past the key-text bound, and one at it",
                caseHang: Duration.minutes(5),
                coverage: noCoverage,
                generator: int(0, filledCases.length - 1),
                limit: filledCases.length,
                literal: (at) => filledCases[at]?.name ?? String(at),
                oracle: {
                  kind: "second-implementation",
                  name: "the law oracle against the laws the import's rows hold on the host",
                },
                suite: "pantry/genetic-filled-key-text",
              },
              (at) =>
                Effect.gen(function* filledCase() {
                  const held = filledCases[at];
                  assert.isDefined(held, `no filled case ${String(at)}`);
                  if (held !== undefined) {
                    const manifest = new TextEncoder().encode(held.manifest);
                    const genome = yield* genomeOf(new Map([["imsmanifest.xml", manifest]]));
                    const judged = yield* judgeOne(genome, bench, at);
                    assert.isFalse(
                      judged.disagreements.some((disagreement) =>
                        recordsClassOf([keyTextBound], disagreement),
                      ),
                      `${held.name}: the oracle says ${judged.summary.oracle}, the import's rows ${judged.summary.import}`,
                    );
                  }
                }),
            );
          }).pipe(Effect.scoped),
        ),
      testTimeoutMs,
    );

    it.effect("keys no signature in both the known and the fixed table", () =>
      // Oracle: the two tables' classes, by sameSignature. Bound: every known and fixed entry's
      // signature.
      Effect.sync(() => {
        assert.deepStrictEqual(
          known
            .filter(({ signature }) =>
              fixed.some((entry) => sameSignature(entry.signature, signature)),
            )
            .map(({ signature }) => shownSignature(signature)),
          [],
          "these signatures key a known entry and a fixed one, so the known entry hides the fixed cause if it shows again; key the known class by the stated limit it falls under (#pantry/test/gen/genetic/judge.ts limitOf), or move it",
        );
      }),
    );

    it.effect("keys every known and fixed entry by a class some package can show", () =>
      // Oracle: grizzle's sameLaw against the laws the host judges, and the uuid fields it holds
      // to the mint. Bound: every known and fixed entry's signature, and one unshowable signature
      // of each shape.
      Effect.sync(() => {
        assert.deepStrictEqual(
          unshowable.filter(canShow).map(shownSignature),
          [],
          "the guard admits a signature no package can show",
        );
        assert.deepStrictEqual(
          knownList.flatMap(({ entry }) =>
            canShow(entry.signature) ? [] : [shownSignature(entry.signature)],
          ),
          [],
          "these signatures key a law the host does not judge, which no statement of Qti states, or a uuid field it does not hold, so they can never show and their entries guard nothing; plant the behaviour each entry's fix removed, judge its package, and rekey it to the signature that shows, or delete it where none can",
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

                  const unrecorded = report.reduced.filter(({ signature }) =>
                    recorded.every((held) => !sameSignature(held, signature)),
                  );
                  console.log(
                    `genetic run ${runLiteral(sketch)}: ${shownResidual(report)}; ${String(report.reduced.length - unrecorded.length)} known classes met`,
                  );
                  assert.deepStrictEqual(
                    unrecorded.map(({ signature }) => shownSignature(signature)),
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

/**
 * The package container against Python's `zipfile`, by a genetic search over zip archives (lane
 * GEN-B): archives built as intentions (`#pantry/test/gen/genetic/zip-archive.ts`), bred by
 * inserting, deleting, swapping and crossing entries, editing an entry's or the archive's fields
 * and splicing record signatures, each read by the package reader (`readZip`, under the production
 * budgets) and by Python, and the reader's verdict held to its documented policy over Python's
 * reading (`#pantry/test/gen/genetic/zip-judge.ts`). Beside the search, a small box of archives,
 * one field off plain at a time, is judged whole on every run; and the writer's archives
 * (`writeZip`) are read back by Python and by the reader.
 *
 * Oracle: a second implementation. Python's `zipfile` shares no code with `zip.ts`; the policy it
 * is read under is `readZip`'s documentation, IMS Content Packaging 1.2 and APPNOTE 6.3.10, each
 * class of refusal with its source (`recorded`). A verdict the policy does not predict is a
 * disagreement, reported reduced by hierarchical delta debugging, with the edits that bred it.
 *
 * The free suite replays, the same on every run: the box, the seeds of the suite's floor stream
 * judged as drawn, and the writer's archives of its own floor stream, so a commit that touches
 * nothing the search reads judges the same archives as the one before it. `GR8DES_GENETIC=1`
 * explores: the bred search, its seed the run's (`TEST_SEED`), and the writer's archives on that
 * seed, each with the long budget; a class it meets is reduced, reported, and kept. The archives
 * are written under a folder of the run's own, `work/genetic-zip-*`, removed after the file.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, describe, layer } from "@effect/vitest";
import { Console, Effect, FileSystem } from "effect";
import { array, element, int } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { floorSeed, rotatingSeed } from "@grizzle/testing/random";
import type { Stream } from "@grizzle/testing/random";
import { sample } from "@grizzle/testing/source";
import { runOfProcess } from "@grizzle/testing/vitest/run";
import { writeZip } from "#pantry/package/zip.ts";
import type { ZipEntry } from "#pantry/package/zip.ts";
import { evolve, reduce } from "#pantry/test/gen/genetic/engine.ts";
import type { Budget, Judgment } from "#pantry/test/gen/genetic/engine.ts";
import {
  comments,
  datas,
  declaredSizes,
  externals,
  fillers,
  hosts,
  manifestName,
  names,
  plainArchive,
  plainEntry,
  render,
  shownIntent,
  smallerZip,
  trailers,
  utf8,
  zipMutation,
} from "#pantry/test/gen/genetic/zip-archive.ts";
import type { EntryIntent, ZipIntent } from "#pantry/test/gen/genetic/zip-archive.ts";
import {
  cleanOf,
  comparedZip,
  expectedOf,
  pantryRead,
  pythonRead,
  pythonRuns,
  writerDisagreements,
  writeScript,
  zipFamilyOf,
  zipFeaturesOf,
} from "#pantry/test/gen/genetic/zip-judge.ts";
import type { ZipDisagreement, ZipFeature } from "#pantry/test/gen/genetic/zip-judge.ts";
import { fileScratchDirectory } from "#pantry/test/scratch.ts";
import { settings } from "#pantry/test/settings.ts";

/**
 * Whether `python3` runs and imports `zipfile`, so the judge can read archives.
 */
const pythonAvailable = await Effect.runPromise(
  pythonRuns.pipe(Effect.provide(NodeServices.layer)),
);

/**
 * The folder the archives and the judge's script are written to, the run's own.
 */
const scratchRoot = fileScratchDirectory("genetic-zip-");

/**
 * The bred search's budget under `GR8DES_GENETIC=1`: seeds, then generations of candidates. A round
 * costs one Python process and a few milliseconds an archive.
 */
const budget: Budget = { candidates: 20_000, edits: 4, generation: 400, initial: 200 };

/**
 * How many seeds of the floor stream the free suite judges, and how many writer cases: the free
 * suite's fixed set, and the exploration's larger one.
 */
const counts = settings.geneticRequested
  ? { seeds: budget.initial, writer: 2000 }
  : { seeds: 100, writer: 200 };

/**
 * The most reduction proposals one finding is judged on, how many go to Python at once, and how
 * many kinds of disagreement a run reduces, the rest reported as found, so a run that meets many
 * kinds, as a planted bug's does, reports them within its timeout.
 */
const reduction = { batch: 60, kinds: 6, tries: 600 } as const;

/**
 * The timeout, in milliseconds, of each test. Measured 2026-11-07: 1.8 s at a load average of 81.8
 * to 87.5 on 10 cores, the slowest free test, the writer's 200 archives of the floor stream; the
 * box took 1.6 s and the 100 fixed seeds 1.1 s. The bred search that ran free before took 18.6 s at
 * a load average of 70 to 78 for 1,700 archives. The free suite's is over six times that, for a
 * machine loaded further; the exploration's two hours. Raise it only on a new measurement recorded
 * here.
 */
const timeoutMs = settings.geneticRequested ? 7_200_000 : 120_000;

/**
 * The stream a test draws on: its floor stream in the free suite, the same on every run, and the
 * run's rotating stream under `GR8DES_GENETIC=1`.
 *
 * @param run - The run's seed (`TEST_SEED`).
 * @param label - The test's floor label.
 * @returns The stream.
 */
const streamOf = (run: number, label: string): Stream =>
  settings.geneticRequested ? rotatingSeed(run, floorSeed(label)) : floorSeed(label);

/**
 * Count the rounds judged, so each writes its archives to a folder of its own.
 */
let rounds = 0;

/**
 * Judge archives: each written, Python run once over all of them, the reader run on each, and its
 * verdict compared with the policy over Python's reading.
 *
 * @param script - The judge's Python script.
 * @param intents - The archives.
 * @returns One judgment per archive, in order.
 */
const judgeZips = Effect.fn("test.geneticZip.judgeZips")(function* judgeZips(
  script: string,
  intents: readonly ZipIntent[],
) {
  const fs = yield* FileSystem.FileSystem;
  rounds += 1;
  const folder = `${scratchRoot}/r${String(rounds)}`;
  yield* fs.makeDirectory(folder, { recursive: true });

  const written = yield* Effect.forEach(
    intents,
    (intent, at) =>
      Effect.gen(function* writeArchive() {
        const rendered = render(intent);
        const path = `${folder}/a${String(at)}.zip`;
        const cleanPath = `${folder}/c${String(at)}.zip`;
        yield* fs.writeFile(path, rendered.bytes);
        yield* fs.writeFile(cleanPath, render(cleanOf(intent)).bytes);

        return { cleanPath, intent, path, rendered };
      }),
    { concurrency: 1 },
  );
  const python = yield* pythonRead(
    script,
    written.flatMap(({ cleanPath, path }) => [path, cleanPath]),
  );

  return yield* Effect.forEach(
    written,
    ({ intent, path, rendered }, at) =>
      Effect.gen(function* judgeArchive() {
        const none = { error: "no view", ok: false as const };
        const view = python[2 * at] ?? none;
        const clean = python[2 * at + 1] ?? none;
        const got = yield* pantryRead(path);
        const disagreement = comparedZip(
          got,
          expectedOf({ clean, intent, python: view, rendered }),
        );

        return {
          disagreements: disagreement === undefined ? [] : [disagreement],
          features: zipFeaturesOf(intent, got, view),
        } satisfies Judgment<ZipFeature, ZipDisagreement>;
      }),
    { concurrency: 1 },
  );
});

/**
 * Reduce a disagreeing archive to the smallest that still shows its kind.
 *
 * @param script - The judge's Python script.
 * @param intent - The archive.
 * @param kind - The disagreement's kind.
 * @returns The reduced archive and the tries spent.
 */
const reduced = (script: string, intent: ZipIntent, kind: string) =>
  reduce(
    intent,
    smallerZip,
    (intents) =>
      Effect.map(judgeZips(script, intents), (judgments) =>
        judgments.map(({ disagreements }) => disagreements.some((held) => held.kind === kind)),
      ),
    reduction.tries,
    reduction.batch,
  );

/**
 * Report each disagreement of a set of findings, reduced.
 *
 * @param script - The judge's Python script.
 * @param found - Each disagreement by its kind, with the archive that showed it and its lineage.
 * @returns One report per kind.
 */
const reportsOf = Effect.fn("test.geneticZip.reportsOf")(function* reportsOf(
  script: string,
  found: ReadonlyMap<
    string,
    {
      readonly disagreement: ZipDisagreement;
      readonly genome: ZipIntent;
      readonly lineage: readonly string[];
    }
  >,
) {
  const reports: string[] = [];
  for (const [kind, { disagreement, lineage }] of [...found].slice(reduction.kinds)) {
    reports.push(
      `${kind}\n  reader: ${disagreement.got}\n  policy over python: ${disagreement.expected}\n  (not reduced: past the first ${String(reduction.kinds)} kinds)\n  bred by: ${lineage.join(" ; ")}`,
    );
  }

  for (const [kind, { disagreement, genome, lineage }] of [...found].slice(0, reduction.kinds)) {
    const small = yield* reduced(script, genome, kind);
    const last = yield* judgeZips(script, [small.genome]);
    const shown = last[0]?.disagreements.find((held) => held.kind === kind) ?? disagreement;
    reports.push(
      [
        kind,
        `  reader: ${shown.got}`,
        `  policy over python: ${shown.expected}`,
        `  bred by: ${lineage.join(" ; ") || "(a seed or a box case)"}`,
        `  reduced in ${String(small.tries)} tries to:`,
        ...shownIntent(small.genome)
          .split("\n")
          .map((line) => `    ${line}`),
        `  bytes: ${Buffer.from(render(small.genome).bytes).toString("hex")}`,
      ].join("\n"),
    );
  }

  return reports;
});

/**
 * The names a seed's files are drawn among: safe package paths, two of them non-ASCII.
 */
const seedNames = ["a.txt", "b.xml", "d/c.xml", "é.xml", "𝔸.xml", "items/i1.xml"] as const;

/**
 * Draw a seed: a package archive, the manifest and up to three files, each stored or deflated, its
 * name flagged UTF-8 or not, made on MS-DOS, Unix or OS X, a file other than the manifest with no
 * mode, a file mode or a directory mode, which only a Unix host's attributes make a directory
 * (APPNOTE 4.4.15).
 */
const seedGen: Gen<ZipIntent> = (source) => {
  const files = source.draw(array(element(seedNames), { max: 3, min: 0 }));
  const unique = [...new Set(files)];
  const entryOf = (name: string): EntryIntent => {
    const data = source.draw(element(datas));
    const host = source.draw(element(hosts));
    const plainName = /^[ -~]*$/u.test(name);

    return {
      ...plainEntry(name, data),
      external: name === manifestName ? 0 : source.draw(element([0, 0x81_a4_00_00, 0x41_ed_00_00])),
      host,
      utf8Flag: plainName ? source.draw(int(0, 1)) === 1 : true,
    };
  };

  return plainArchive([entryOf(manifestName), ...unique.map(entryOf)]);
};

/**
 * The small box: a plain archive, and each field of an entry or of the archive drawn off plain one
 * at a time over its dictionary, so every single-fault archive the dictionaries name is judged on
 * every run.
 *
 * @returns The archives.
 */
const boxOf = (): readonly ZipIntent[] => {
  const manifest = plainEntry(manifestName, utf8("<manifest/>"));
  const file = plainEntry("a.txt", utf8("hello"));
  const big = plainEntry("b.xml", utf8("z".repeat(300)));
  const plain = plainArchive([manifest, file, big]);
  const withFile = (edit: Partial<EntryIntent>): ZipIntent =>
    plainArchive([manifest, { ...file, ...edit }, big]);
  const withManifest = (edit: Partial<EntryIntent>): ZipIntent =>
    plainArchive([{ ...manifest, ...edit }, file, big]);

  return [
    plain,
    ...hosts.flatMap((host) =>
      externals.flatMap((external) => [
        withFile({ external, host }),
        withManifest({ external, host }),
      ]),
    ),
    ...[
      [1, 0],
      [0, 1],
      [1, 1],
    ].map(([disk = 0, cdDisk = 0]) => ({ ...plain, cdDisk, disk })),
    ...fillers
      .filter(({ length }) => length > 0)
      .flatMap((filler) => [
        { ...plain, gap: filler },
        { ...plain, prefix: filler },
      ]),
    ...comments.map((comment) => ({ ...plain, comment })),
    ...trailers.map((trailing) => ({ ...plain, trailing })),
    ...(["record-and-locator", "record", "locator", "count-marker"] as const).map((zip64) => ({
      ...plain,
      zip64,
    })),
    ...declaredSizes.flatMap((declared) => [
      withFile({ declared }),
      plainArchive([manifest, file, { ...big, declared }]),
    ]),
    withFile({ stored: -1 }),
    withFile({ stored: 1 }),
    withFile({ crc: "wrong" }),
    withFile({ method: 12 }),
    withFile({ method: 8 }),
    withFile({ encrypted: true }),
    withFile({ descriptor: true }),
    withFile({ extra: "unknown" }),
    withFile({ extra: "zip64" }),
    withFile({ localName: "zz.txt" }),
    withFile({ name: "é.xml", utf8Flag: false }),
    { ...plain, centralOrder: "reversed" },
    { ...plain, aliases: [{ name: "c.txt", of: 1 }] },
    { ...plain, aliases: [{ name: "d/", of: 1 }] },
    ...names.map((name) => plainArchive([manifest, file, plainEntry(name, utf8("n"))])),
    plainArchive([file]),
    plainArchive([manifest, manifest]),
    plainArchive([manifest, file, file]),
  ];
};

/**
 * Draw a writer case: the manifest and up to four other files of distinct names, each of a size
 * about the writer's 64-byte storing threshold or of bytes that compress poorly.
 */
const writerGen: Gen<readonly ZipEntry[]> = (source) => {
  const others = [...new Set(source.draw(array(element(seedNames), { max: 4, min: 0 })))];
  const bytesOf = (): Uint8Array => {
    const size = source.draw(element([0, 1, 63, 64, 65, 200]));
    const seed = source.draw(int(0, 255));

    return source.draw(element([true, false]))
      ? utf8("q".repeat(size))
      : Uint8Array.from({ length: size }, (_, at) => (at * 131 + seed) % 256);
  };

  return [manifestName, ...others].map((path) => ({ bytes: bytesOf(), path }));
};

describe.skipIf(!pythonAvailable)("genetic-zip.test.ts", () => {
  layer(NodeServices.layer, { excludeTestServices: true })(
    "the package container against Python's zipfile",
    (it) => {
      it.effect(
        "every archive of the small box, one field off plain at a time, has the verdict the policy over Python's reading says",
        () =>
          Effect.gen(function* box() {
            const script = yield* writeScript(`${scratchRoot}/script`);
            const intents = boxOf();
            const judgments = yield* judgeZips(script, intents);
            const found = new Map<
              string,
              {
                readonly disagreement: ZipDisagreement;
                readonly genome: ZipIntent;
                readonly lineage: readonly string[];
              }
            >();
            for (const [at, { disagreements }] of judgments.entries()) {
              for (const disagreement of disagreements) {
                const genome = intents[at];
                if (genome !== undefined && !found.has(disagreement.kind)) {
                  found.set(disagreement.kind, { disagreement, genome, lineage: [] });
                }
              }
            }

            const reports = yield* reportsOf(script, found);
            yield* Console.log(
              [
                `genetic-zip box: ${String(intents.length)} archives, ${String(found.size)} disagreement kinds ${JSON.stringify([...found.keys()])}`,
                ...reports,
              ].join("\n"),
            );

            assert.deepStrictEqual(
              reports,
              [],
              "the reader reads every box archive as its policy says",
            );
          }),
        { timeout: timeoutMs },
      );

      it.effect(
        "every seed of the floor stream, as drawn, has the verdict the policy over Python's reading says",
        () =>
          Effect.gen(function* fixedSeeds() {
            const script = yield* writeScript(`${scratchRoot}/script`);
            const seeds = sample(seedGen, floorSeed("pantry/genetic-zip"), counts.seeds);
            const judgments = yield* judgeZips(script, seeds);
            const found = new Map<
              string,
              {
                readonly disagreement: ZipDisagreement;
                readonly genome: ZipIntent;
                readonly lineage: readonly string[];
              }
            >();
            for (const [at, { disagreements }] of judgments.entries()) {
              for (const disagreement of disagreements) {
                const genome = seeds[at];
                if (genome !== undefined && !found.has(disagreement.kind)) {
                  found.set(disagreement.kind, { disagreement, genome, lineage: [] });
                }
              }
            }

            const reports = yield* reportsOf(script, found);
            yield* Console.log(
              [
                `genetic-zip fixed seeds: ${String(seeds.length)} archives, ${String(found.size)} disagreement kinds ${JSON.stringify([...found.keys()])}`,
                ...reports,
              ].join("\n"),
            );

            assert.deepStrictEqual(
              reports,
              [],
              "the reader reads every fixed seed as its policy says",
            );
          }),
        { timeout: timeoutMs },
      );

      it.effect.skipIf(!settings.geneticRequested)(
        "every bred archive has the verdict the policy over Python's reading says",
        () =>
          Effect.gen(function* breed() {
            const script = yield* writeScript(`${scratchRoot}/script`);
            const run = yield* runOfProcess;
            const stream = rotatingSeed(run.seed, floorSeed("pantry/genetic-zip"));
            const seeds = sample(seedGen, stream, budget.initial);
            const evolved = yield* evolve(
              {
                familyOf: zipFamilyOf,
                judge: (intents) => judgeZips(script, intents),
                mutate: zipMutation,
                seeds,
                signatureOf: ({ kind }) => kind,
              },
              budget,
              stream,
            );
            const reports = yield* reportsOf(script, evolved.found);

            yield* Console.log(
              [
                `genetic-zip: TEST_SEED=${String(run.seed)}, budget ${JSON.stringify(budget)}, ${String(evolved.evaluated)} archives judged, population ${String(evolved.population)}, ${String(evolved.features.size)} features, ${String(evolved.found.size)} disagreement kinds ${JSON.stringify([...evolved.found.keys()])}`,
                `  residual (Good–Turing f1/n) by family: ${evolved.residual.map(({ candidates, estimate, family, observed, singletons }) => `${family} ${String(singletons)}/${String(candidates)} = ${estimate.toFixed(3)} of ${String(observed)} seen`).join("; ")}`,
                ...reports,
              ].join("\n"),
            );

            assert.deepStrictEqual(
              reports,
              [],
              "the reader reads every bred archive as its policy says",
            );
          }),
        { timeout: timeoutMs },
      );

      it.effect(
        "every archive the writer writes reads back, in Python and in the reader, with the header fields it documents",
        () =>
          Effect.gen(function* writer() {
            const fs = yield* FileSystem.FileSystem;
            const script = yield* writeScript(`${scratchRoot}/script`);
            const run = yield* runOfProcess;
            const cases = sample(
              writerGen,
              streamOf(run.seed, "pantry/genetic-zip-writer"),
              counts.writer,
            );
            const folder = `${scratchRoot}/writer`;
            yield* fs.makeDirectory(folder, { recursive: true });

            const paths = yield* Effect.forEach(
              cases,
              (entries, at) =>
                Effect.gen(function* writeCase() {
                  const path = `${folder}/w${String(at)}.zip`;
                  yield* fs.writeFile(path, writeZip(entries));

                  return path;
                }),
              { concurrency: 1 },
            );
            const python = yield* pythonRead(script, paths);
            const found = new Map<string, string>();
            for (const [at, entries] of cases.entries()) {
              const view = python[at] ?? { error: "no view", ok: false as const };
              const path = paths[at] ?? "";
              for (const disagreement of writerDisagreements(
                entries,
                view,
                yield* pantryRead(path),
              )) {
                const kind = disagreement.replace(/entry \S+'s/u, "an entry's");
                if (!found.has(kind)) {
                  found.set(
                    kind,
                    `${disagreement} (entries ${JSON.stringify(entries.map(({ bytes, path: name }) => `${name}:${String(bytes.length)}`))})`,
                  );
                }
              }
            }

            yield* Console.log(
              `genetic-zip writer: ${settings.geneticRequested ? `TEST_SEED=${String(run.seed)}` : "the floor stream"}, ${String(cases.length)} archives, ${String(found.size)} disagreement kinds ${JSON.stringify([...found.keys()])}`,
            );

            assert.deepStrictEqual(
              [...found.values()],
              [],
              "every written archive reads back as written",
            );
          }),
        { timeout: timeoutMs },
      );
    },
  );
});

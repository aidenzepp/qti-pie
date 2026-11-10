/**
 * The accessibility sweep over the corpus: axe-core's WCAG 2.2 A and AA rules over every corpus
 * item `open` accepts, in Chromium and in WebKit, with plate's default stylesheet.
 *
 * From the repository root:
 *
 * ```sh
 * PLAYWRIGHT_BROWSERS_PATH="$HOME/.cache/gr8des/ms-playwright" node packages/plate/scripts/sweep.ts
 * ```
 *
 * It opens every corpus document and, in each engine, checks each accepted item in its three
 * render states under the stylesheet's fallback colours with every rule, and once more under
 * shadcn's `.dark` colours for contrast (`src/test/axe.ts`). It writes `sweep.json`, the whole
 * report, and `sweep.txt`, a line for each violation by item, state, palette, engine, rule and
 * part, to `work/sweep` in the package, and prints the paths, each engine with its version, and
 * the text. It exits 1 when any check has a violation, and 0 when none has: a rule's incomplete
 * results are counted and never change the exit code.
 *
 * It is the freeze's command and is never part of `test:browser`: the corpus holds about 550
 * documents `open` accepts, each checked four times in each engine, so it takes minutes.
 * Automated rules settle part of a criterion only; the screen-reader pass is a local, recorded
 * pass outside this command.
 */
/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown, so the rule's "call without new" reading does not apply. */
import { mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Console, Effect, Schema } from "effect";
import { sweepMembers, sweepText } from "#plate/test/axe.ts";
import type { SweepReport, SweepRow } from "#plate/test/axe.ts";
import { Engine, engineLayer, engineNames, refuseLoad } from "#plate/test/browsers.ts";
import type { EngineName } from "#plate/test/browsers.ts";
import { openCorpus } from "#plate/test/sweep.ts";
import type { Member } from "#plate/test/sweep.ts";

/**
 * The folder the report is written to, `work/sweep` in the package, which git ignores.
 */
const outputDirectory = path.resolve(import.meta.dirname, "..", "work", "sweep");

/**
 * The names of the report's two files, `sweep.json` and `sweep.txt`.
 */
const outputNames = { json: "sweep.json", text: "sweep.txt" } as const;

/**
 * The failure of a report, or its folder, that cannot be written.
 */
class SweepOutputUnwritable extends Schema.TaggedError<SweepOutputUnwritable>()(
  "SweepOutputUnwritable",
  { path: Schema.String },
) {
  /**
   * What failed and what to change.
   */
  override get message(): string {
    return `Cannot write ${this.path}. The sweep's rows are not saved; make the folder writable, then run the command again.`;
  }
}

/**
 * Write one output, creating its folder first.
 *
 * @param file The output's path.
 * @param text Its text.
 * @returns Nothing; {@link SweepOutputUnwritable} when the folder or the file cannot be written.
 */
const writeOutput = (file: string, text: string): Effect.Effect<void, SweepOutputUnwritable> =>
  Effect.tryPromise({
    catch: () => new SweepOutputUnwritable({ path: file }),
    try: async () => {
      await mkdir(path.dirname(file), { recursive: true });
      await writeFile(file, text);
    },
  });

/**
 * Sweep the members in one engine, launched for the sweep and closed after it.
 *
 * @param members The corpus members.
 * @param name The engine.
 * @returns The engine's name and version, and its rows.
 */
const sweepEngine = (members: readonly Member[], name: EngineName) =>
  Effect.gen(function* sweepInEngine() {
    const engine = yield* Engine;

    yield* Console.log(`Sweeping in ${engine.name} ${engine.version}.`);

    const rows = yield* sweepMembers(members);

    return { engine: { name: engine.name, version: engine.version }, rows };
  }).pipe(
    Effect.provide(engineLayer(name)),
    Effect.withSpan("sweepEngine", { attributes: { engine: name } }),
  );

/**
 * The command: refuse to start under load, open the corpus, sweep it in each engine, write the
 * report, print it, and set the exit code. A failure that stops the sweep prints its message and
 * exits 1, with nothing written.
 */
const program = Effect.gen(function* sweepCommand() {
  yield* Effect.fromResult(refuseLoad(os.loadavg()[0] ?? 0));

  const members = yield* openCorpus;
  const engines: { name: EngineName; version: string }[] = [];
  const rows: SweepRow[] = [];

  for (const name of engineNames) {
    const swept = yield* sweepEngine(members, name);

    engines.push(swept.engine);
    rows.push(...swept.rows);
  }

  const report: SweepReport = {
    engines,
    items: new Set(rows.map((row) => row.location)).size,
    renders: rows.length,
    rows,
  };
  const text = sweepText(report);
  const json = path.join(outputDirectory, outputNames.json);
  const txt = path.join(outputDirectory, outputNames.text);

  yield* writeOutput(json, `${JSON.stringify(report, null, 2)}\n`);
  yield* writeOutput(txt, text);
  yield* Console.log(
    [
      "Wrote:",
      `  ${json}`,
      `  ${txt}`,
      ...engines.map((engine) => `Engine ${engine.name} ${engine.version}`),
      text.trimEnd(),
    ].join("\n"),
  );

  yield* Effect.sync(() => {
    process.exitCode = rows.some((row) => row.check.violations.length > 0) ? 1 : 0;
  });
}).pipe(
  Effect.matchEffect({
    onFailure: (failure) =>
      Console.error(failure.message).pipe(
        Effect.andThen(
          Effect.sync(() => {
            process.exitCode = 1;
          }),
        ),
      ),
    onSuccess: () => Effect.void,
  }),
  Effect.withSpan("sweep"),
);

if (import.meta.main) {
  await Effect.runPromise(program);
}

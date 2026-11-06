/**
 * The browser run's global setup, which `vite.browser.config.ts` registers as `globalSetup`.
 *
 * Before any browser file loads, it refuses the run while the 1-minute load average is at the cap
 * or above, so a refused run launches no engine. Then it launches each engine headless, reads the
 * version the browser reports, closes it, and writes the browser-run record
 * (`#plate/ledger/runs.ts`) to the ledger's folder, so the ledger can say which engines, at which
 * versions, the browser tests ran in. An engine that is not installed fails its launch with
 * `BrowsersMissing`, whose message says how to download it, and the run stops before any test.
 */
/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown, so the rule's "call without new" reading does not apply. */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { DateTime, Effect, Schema } from "effect";
import { ledgerDirectory } from "#plate/ledger/directory.ts";
import { BrowserRun, browserRunFile } from "#plate/ledger/runs.ts";
import type { EngineRun } from "#plate/ledger/runs.ts";
import { Engine, engineLayer, engineNames, refuseLoad } from "#plate/test/browsers.ts";
import type { EngineName } from "#plate/test/browsers.ts";

/**
 * The failure of reading the version of `playwright-core` from its `package.json`.
 */
class PlaywrightVersionUnreadable extends Schema.TaggedError<PlaywrightVersionUnreadable>()(
  "PlaywrightVersionUnreadable",
  { detail: Schema.String },
) {
  /**
   * What failed and what to change.
   */
  override get message(): string {
    return `Cannot read playwright-core's version from playwright-core/package.json: ${this.detail}. Install the workspace's dependencies with \`pnpm install --frozen-lockfile\`, so the package and its manifest are in place.`;
  }
}

/**
 * The failure of creating the ledger's folder or writing the browser-run record into it.
 */
class RunRecordUnwritable extends Schema.TaggedError<RunRecordUnwritable>()("RunRecordUnwritable", {
  path: Schema.String,
}) {
  /**
   * What failed and what to change.
   */
  override get message(): string {
    return `Cannot write the browser-run record at ${this.path}. Set PLATE_LEDGER_DIR to a folder this process can create and write, or make that path writable, then run the browser tests again.`;
  }
}

/**
 * Node's `require`, which resolves `playwright-core/package.json`, a subpath `playwright-core`'s
 * `exports` map lists, to its file.
 */
const requireModule = createRequire(import.meta.url);

/**
 * Decode `playwright-core/package.json`'s text into the part the record reads, its version.
 */
const decodeManifest = Schema.decodeEffect(
  Schema.fromJsonString(Schema.Struct({ version: Schema.String })),
);

/**
 * The version of `playwright-core` that drives the engines, read from its `package.json`.
 */
const playwrightVersion = Effect.gen(function* playwrightVersion() {
  const manifest = yield* Effect.try({
    catch: (cause) =>
      new PlaywrightVersionUnreadable({
        detail: cause instanceof Error ? cause.message : String(cause),
      }),
    try: () => requireModule.resolve("playwright-core/package.json"),
  });
  const text = yield* Effect.tryPromise({
    catch: (cause) =>
      new PlaywrightVersionUnreadable({
        detail: cause instanceof Error ? cause.message : String(cause),
      }),
    try: () => readFile(manifest, "utf-8"),
  });
  const { version } = yield* decodeManifest(text).pipe(
    Effect.mapError((failure) => new PlaywrightVersionUnreadable({ detail: failure.message })),
  );

  return version;
});

/**
 * Encode a browser-run record as its file's text: two-space JSON, which `BrowserRun` decodes.
 */
const encodeRun = Schema.encodeEffect(Schema.fromJsonString(BrowserRun, { space: 2 }));

/**
 * One engine's entry: its name and the version its browser reported, and on WebKit's entry the
 * browser it stands in for.
 *
 * @param name The engine.
 * @param version The version the launched browser reported.
 * @returns The entry.
 */
const engineRun = (name: EngineName, version: string): EngineRun =>
  name === "webkit" ? { engine: name, standsInFor: "Safari", version } : { engine: name, version };

/**
 * Launch one engine headless, read the version its browser reports, and close it.
 *
 * @param name The engine.
 * @returns The engine's entry in the record.
 */
const launchedRun = (name: EngineName) =>
  Effect.gen(function* readVersion() {
    const { version } = yield* Engine;

    return engineRun(name, version);
  }).pipe(Effect.provide(engineLayer(name)));

/**
 * Launch each engine in turn, then write the record of the run to {@link browserRunFile} in the
 * ledger's folder, `PLATE_LEDGER_DIR` (`work/ledger` in the package by default), creating the
 * folder when it is missing. An engine that is not installed fails with `BrowsersMissing`.
 */
const recordRun = Effect.gen(function* recordRun() {
  const date = DateTime.formatIso(yield* DateTime.now);
  const playwright = yield* playwrightVersion;
  const engines = yield* Effect.all(engineNames.map((name) => launchedRun(name)));
  const folder = yield* ledgerDirectory;
  const file = path.join(folder, browserRunFile);
  const text = yield* encodeRun({ date, engines, playwright });

  yield* Effect.tryPromise({
    catch: () => new RunRecordUnwritable({ path: folder }),
    try: () => mkdir(folder, { recursive: true }),
  });
  yield* Effect.tryPromise({
    catch: () => new RunRecordUnwritable({ path: file }),
    try: () => writeFile(file, `${text}\n`),
  });
}).pipe(Effect.withSpan("browserRunRecord"));

/**
 * The load cap, checked before any engine launches, followed by the record of the engines the run
 * launches.
 */
const ready = Effect.gen(function* ready() {
  const [load = Number.NaN] = os.loadavg();

  yield* Effect.fromResult(refuseLoad(load));
  yield* recordRun;
}).pipe(Effect.withSpan("browserSetup"));

/**
 * Run the checks before the browser run, then record its engines. A failure rejects with the
 * typed error, whose message says what to change, and Vitest stops the run before any test file
 * loads.
 *
 * @returns A promise that settles once every check has passed and the record is written.
 */
export default async function setup(): Promise<void> {
  await Effect.runPromise(ready);
}

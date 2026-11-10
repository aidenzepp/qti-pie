/* oxlint-disable unicorn/throw-new-error -- Schema.TaggedError is a schema class factory. */
/**
 * Fill the spec cache, `~/.cache/gr8des/`, with every file the tests read from it: the pinned XSDs,
 * the specification sources the spec cache pins, and the text renderings derived from them, each
 * checked against its SHA-256 pin.
 *
 * Run it as `pnpm --filter @qti-pie/pantry run fetch-specs` from anywhere in the workspace. It
 * first checks that `xmllint`, which the spec tests run, starts as they start it, and fetches
 * nothing when it does not. A cached file that hashes to its pin is kept, and no request is made
 * for it. An absent file, or one whose bytes differ from its pin, is downloaded, and the download
 * is written only when it hashes to the pin, into a scratch directory inside the cache and then
 * renamed into place, so the cache never holds a partial or unpinned file under a pinned path.
 * Every pin is attempted; the run then fails naming each one it could not settle, and a second run
 * requests only those. Once every source is in place, each rendering is derived from its source by
 * the recorded command, `#pantry/test/spec-cache/render.ts`, and written the same way only when it
 * hashes to its pin. It writes only under {@link cacheDirectory} and touches no database.
 *
 * The downloads follow the XSD fetcher's, `#pantry/vocab/derive/fetch-xsds.ts`, and share its
 * limits, its check of a cached file against its pin, its write into place and its account of a
 * failed request.
 *
 * @see {@link https://github.com/aidenzepp/qti-pie/issues/98 | qti-pie#98, a script that fills the spec caches}
 */
import { NodeRuntime, NodeServices } from "@effect/platform-node";
import { Console, Effect, FileSystem, Layer, Path, Result, Schema } from "effect";
import { Command } from "effect/cli";
import { Digest } from "effect/crypto";
import { HttpClient } from "effect/http";
import { cacheDirectory, pins } from "#pantry/test/spec-cache/pins.ts";
import type { FetchedSource, Rendering, SpecPins } from "#pantry/test/spec-cache/pins.ts";
import { renderText } from "#pantry/test/spec-cache/render.ts";
import {
  concurrency,
  downloadBytes,
  downloadClient,
  fetchPinned,
  heldAgainstPin,
  placeFile,
  reasonOf,
} from "#pantry/vocab/derive/fetch-xsds.ts";
import type { FetchReport, Settled, XsdPins } from "#pantry/vocab/derive/fetch-xsds.ts";
import { sources } from "#pantry/vocab/derive/sources.ts";
import { xmllintPath, xmllintRun } from "#pantry/xml/oracle.ts";

/**
 * The command that fills the spec cache, which the errors name as the repair.
 */
export const fetchSpecsCommand = "pnpm --filter @qti-pie/pantry run fetch-specs";

/**
 * No `xmllint` runs as the spec tests run it, so nothing was fetched.
 *
 * `executable` is what was run, the path `XMLLINT` names or, when it names none, `xmllint` on
 * `PATH`; `reason` is why it did not run: what the platform said when it did not start, or the
 * status and standard error of a run of `xmllint --version` that failed.
 */
export class SpecXmllintUnavailable extends Schema.TaggedError<SpecXmllintUnavailable>()(
  "SpecXmllintUnavailable",
  { executable: Schema.String, reason: Schema.String },
) {
  /**
   * Which executable did not run, why, that nothing was fetched, and how to supply one.
   */
  override get message(): string {
    return `The spec tests run xmllint, and none runs as ${this.executable} (${this.reason}), so nothing was downloaded. Put libxml2's xmllint on PATH, or set XMLLINT to its path, then run \`${fetchSpecsCommand}\` again.`;
  }
}

/**
 * Check that `xmllint` runs as the spec tests run it, by running `xmllint --version`.
 *
 * @returns Nothing once it ran and exited 0; a {@link SpecXmllintUnavailable} when it did not start
 *   or exited otherwise.
 */
const requireXmllint = Effect.fn("test.specCache.requireXmllint")(function* requireXmllint() {
  const executable = yield* Effect.orDie(xmllintPath);
  const run = yield* xmllintRun(["--version"]).pipe(
    Effect.mapError(({ reason }) => new SpecXmllintUnavailable({ executable, reason })),
  );

  if (run.code !== 0) {
    yield* new SpecXmllintUnavailable({
      executable,
      reason: `xmllint --version exited ${String(run.code)}: ${run.stderr.trim()}`,
    });
  }
});

/**
 * A pinned specification source could not be downloaded.
 *
 * `reason` says what the request ended with. `staleCopy` is whether the cache already held a file
 * at the path whose bytes differ from the pin; that file is left as it was.
 */
export class SpecDownloadFailed extends Schema.TaggedError<SpecDownloadFailed>()(
  "SpecDownloadFailed",
  { path: Schema.String, reason: Schema.String, staleCopy: Schema.Boolean, url: Schema.String },
) {
  /**
   * Which file was not downloaded, from where, and why.
   */
  override get message(): string {
    return `${this.path} was not downloaded from ${this.url}: ${this.reason}.${this.staleCopy ? " The cached copy, which does not match its pin, was left as it was." : ""}`;
  }
}

/**
 * A pinned specification source's URL serves bytes that do not hash to its pin, so they were not
 * written.
 *
 * `expected` is the pinned SHA-256 and `actual` the digest of the bytes served. `staleCopy` is
 * whether the cache already held a file at the path whose bytes differ from the pin; that file is
 * left as it was.
 */
export class SpecPublishedChanged extends Schema.TaggedError<SpecPublishedChanged>()(
  "SpecPublishedChanged",
  {
    actual: Schema.String,
    expected: Schema.String,
    path: Schema.String,
    staleCopy: Schema.Boolean,
    url: Schema.String,
  },
) {
  /**
   * Which URL serves other bytes than its pin, and that nothing was written for it.
   */
  override get message(): string {
    return `${this.url} serves a file with SHA-256 ${this.actual}, not the pinned ${this.expected}, so ${this.path} was not written.${this.staleCopy ? " The cached copy, which does not match its pin either, was left as it was." : ""}`;
  }
}

/**
 * Why one source could not be settled: its download failed, or it served other bytes than its pin.
 */
export type SpecFailure = SpecDownloadFailed | SpecPublishedChanged;

/**
 * Keep a source's failure as a value, so a run attempts every pin before it fails.
 *
 * @param failure - The source's failure.
 * @returns The failure as a failed result, in the success channel.
 */
const keptFailure = (failure: SpecFailure) =>
  Effect.succeed<Result.Result<Settled, SpecFailure>>(Result.fail(failure));

/**
 * Some pinned specification sources could not be put in the spec cache.
 *
 * `failures` lists each one and why, `pinned` is how many sources the table pins, and every source
 * not among the failures is in the cache and hashes to its pin.
 */
export class SpecFetchIncomplete extends Schema.TaggedError<SpecFetchIncomplete>()(
  "SpecFetchIncomplete",
  {
    directory: Schema.String,
    failures: Schema.Array(Schema.Union([SpecDownloadFailed, SpecPublishedChanged])),
    pinned: Schema.Number,
  },
) {
  /**
   * Which files are missing and why, that the rest are in place, and what settles each kind of
   * failure.
   */
  override get message(): string {
    const missing = this.failures.length;
    const rest = this.pinned - missing;
    const repairs = [
      ...(this.failures.some((failure) => failure._tag === "SpecDownloadFailed")
        ? [
            `For a download that failed, check that its URL answers, then run \`${fetchSpecsCommand}\` again; it requests only the files still missing.`,
          ]
        : []),
      ...(this.failures.some((failure) => failure._tag === "SpecPublishedChanged")
        ? [
            "For a file that changed where it is published, review the change, then re-pin it in src/test/spec-cache/pins.ts (src/test/spec-sections.ts for an IMS specification), re-anchor the tests that cite its lines, and run them again.",
          ]
        : []),
    ];

    return [
      `${String(missing)} of the ${String(this.pinned)} pinned specification sources could not be put in ${this.directory}:`,
      ...this.failures.map((failure) => `  - ${failure.message}`),
      rest === 1
        ? "The remaining 1 is in place, checked against its pin."
        : `The remaining ${String(rest)} are in place, each checked against its pin.`,
      ...repairs,
    ].join("\n");
  }
}

/**
 * A rendering made from its pinned source by the recorded command does not hash to its pin, so it
 * was not written.
 *
 * `expected` is the pinned SHA-256 and `actual` the digest of the rendering made. `staleCopy` is
 * whether the cache already held a file at the path whose bytes differ from the pin; that file is
 * left as it was.
 */
export class SpecRenderingChanged extends Schema.TaggedError<SpecRenderingChanged>()(
  "SpecRenderingChanged",
  {
    actual: Schema.String,
    expected: Schema.String,
    from: Schema.String,
    path: Schema.String,
    staleCopy: Schema.Boolean,
  },
) {
  /**
   * Which rendering differs from its pin, and that nothing was written for it.
   */
  override get message(): string {
    return `${this.path}, rendered from ${this.from}, has SHA-256 ${this.actual}, not the pinned ${this.expected}, so it was not written.${this.staleCopy ? " The cached copy, which does not match its pin either, was left as it was." : ""}`;
  }
}

/**
 * A pinned source holds a character reference the recorded command does not decode, so its
 * rendering was not made.
 *
 * `entity` is the reference and `offset` where it stands in the source.
 */
export class SpecRenderingUndecodable extends Schema.TaggedError<SpecRenderingUndecodable>()(
  "SpecRenderingUndecodable",
  { entity: Schema.String, from: Schema.String, offset: Schema.Number, path: Schema.String },
) {
  /**
   * Which rendering was not made, and the reference that stopped it.
   */
  override get message(): string {
    return `${this.path} was not rendered: ${this.from} holds ${this.entity} at offset ${String(this.offset)}, which the recorded command does not decode.`;
  }
}

/**
 * Why one rendering could not be put in the cache: it differs from its pin, or its source holds a
 * reference the recorded command does not decode.
 */
export type RenderingFailure = SpecRenderingChanged | SpecRenderingUndecodable;

/**
 * What a run did with one rendering: `present` when the cache already held its bytes, `derived`
 * when it was absent and is now rendered, `replaced` when the cached bytes differed from the pin
 * and the rendering replaced them.
 */
export type Rendered = "present" | "derived" | "replaced";

/**
 * Keep a rendering's failure as a value, so a run attempts every rendering before it fails.
 *
 * @param failure - The rendering's failure.
 * @returns The failure as a failed result, in the success channel.
 */
const keptRenderingFailure = (failure: RenderingFailure) =>
  Effect.succeed<Result.Result<Rendered, RenderingFailure>>(Result.fail(failure));

/**
 * Some pinned renderings could not be put in the spec cache, every source being in place.
 *
 * `failures` lists each one and why, `pinned` is how many renderings the table pins, and every
 * rendering not among the failures is in the cache and hashes to its pin.
 */
export class SpecRenderIncomplete extends Schema.TaggedError<SpecRenderIncomplete>()(
  "SpecRenderIncomplete",
  {
    directory: Schema.String,
    failures: Schema.Array(Schema.Union([SpecRenderingChanged, SpecRenderingUndecodable])),
    pinned: Schema.Number,
  },
) {
  /**
   * Which renderings are missing and why, that the rest are in place, and what settles each kind
   * of failure.
   */
  override get message(): string {
    const missing = this.failures.length;
    const rest = this.pinned - missing;
    const repairs = [
      ...(this.failures.some((failure) => failure._tag === "SpecRenderingChanged")
        ? [
            "For a rendering whose digest differs, the recorded command (src/test/spec-cache/render.ts) no longer gives the pinned text: review the new text, then re-pin it in src/test/spec-cache/pins.ts (src/test/spec-sections.ts for an IMS specification), re-anchor the tests that cite its lines, and run them again, as qti-pie#98 records.",
          ]
        : []),
      ...(this.failures.some((failure) => failure._tag === "SpecRenderingUndecodable")
        ? [
            "For a reference the recorded command does not decode, check the source against its pin, and add the entity to src/test/spec-cache/render.ts only if the pinned rendering decodes it.",
          ]
        : []),
    ];

    return [
      `Every pinned specification source is in ${this.directory}, but ${String(missing)} of the ${String(this.pinned)} pinned renderings could not be put there:`,
      ...this.failures.map((failure) => `  - ${failure.message}`),
      rest === 1
        ? "The remaining 1 is in place, checked against its pin."
        : `The remaining ${String(rest)} are in place, each checked against its pin.`,
      ...repairs,
    ].join("\n");
  }
}

/**
 * Settle one source: keep the cached file when it hashes to the pin, and otherwise download it and
 * write it when the download does.
 *
 * @param source - The source's path under the cache directory, its URL and its SHA-256.
 * @param scratch - A path in the scratch directory, inside the cache directory, that no other source
 *   uses; a download is written there before it is renamed into place.
 * @param directory - The cache directory.
 * @param client - The client the download is made with, refusing every status but 2xx.
 * @returns What was done; a {@link SpecDownloadFailed} when the download failed, or a
 *   {@link SpecPublishedChanged} when its bytes differ from the pin.
 */
const settle = Effect.fn("test.specCache.fetchSpec")(function* settle(
  source: FetchedSource,
  scratch: string,
  directory: string,
  client: HttpClient.HttpClient,
) {
  const { path, sha256, url } = source;

  yield* Effect.annotateCurrentSpan({ path, url });

  const paths = yield* Path.Path;
  const digest = yield* Digest.Digest;
  const destination = paths.join(directory, path);
  const held = yield* heldAgainstPin(destination, sha256);

  if (held === "pinned") {
    return "present" satisfies Settled;
  }

  const staleCopy = held === "stale";
  const bytes = yield* downloadBytes(client, url).pipe(
    Effect.mapError(
      (error) => new SpecDownloadFailed({ path, reason: reasonOf(error), staleCopy, url }),
    ),
  );
  const actual = yield* digest.digestHex(Digest.sha256, bytes);

  if (actual !== sha256) {
    return yield* new SpecPublishedChanged({ actual, expected: sha256, path, staleCopy, url });
  }

  yield* placeFile(bytes, scratch, destination);

  return staleCopy ? ("replaced" satisfies Settled) : ("fetched" satisfies Settled);
});

/**
 * Derive one rendering: keep the cached file when it hashes to the pin, and otherwise render its
 * source by the recorded command and write the rendering when it does.
 *
 * @param rendering - The rendering's path under the cache directory, its source's path and its
 *   SHA-256; the source is in the cache and hashes to its own pin.
 * @param scratch - A path in the scratch directory, inside the cache directory, that nothing else
 *   uses; the rendering is written there before it is renamed into place.
 * @param directory - The cache directory.
 * @returns What was done; a {@link SpecRenderingChanged} when the rendering differs from its pin,
 *   or a {@link SpecRenderingUndecodable} when the source holds a reference the command does not
 *   decode.
 */
const derive = Effect.fn("test.specCache.deriveRendering")(function* derive(
  rendering: Rendering,
  scratch: string,
  directory: string,
) {
  const { from, path, sha256 } = rendering;

  yield* Effect.annotateCurrentSpan({ from, path });

  const fs = yield* FileSystem.FileSystem;
  const paths = yield* Path.Path;
  const digest = yield* Digest.Digest;
  const destination = paths.join(directory, path);
  const held = yield* heldAgainstPin(destination, sha256);

  if (held === "pinned") {
    return "present" satisfies Rendered;
  }

  const staleCopy = held === "stale";
  const text = renderText(yield* fs.readFileString(paths.join(directory, from)));

  if (Result.isFailure(text)) {
    const { entity, offset } = text.failure;

    return yield* new SpecRenderingUndecodable({ entity, from, offset, path });
  }

  const bytes = new TextEncoder().encode(text.success);
  const actual = yield* digest.digestHex(Digest.sha256, bytes);

  if (actual !== sha256) {
    return yield* new SpecRenderingChanged({ actual, expected: sha256, from, path, staleCopy });
  }

  yield* placeFile(bytes, scratch, destination);

  return staleCopy ? ("replaced" satisfies Rendered) : ("derived" satisfies Rendered);
});

/**
 * What a run left in the spec cache: the XSD run's report, and, in the table's order, every source
 * and every rendering with what the run did with it. Each file named is in the cache and hashes to
 * its pin.
 */
export interface SpecReport extends FetchReport {
  readonly renderings: readonly { readonly outcome: Rendered; readonly path: string }[];
  readonly xsds: FetchReport;
}

/**
 * Fill the spec cache: check that `xmllint` runs, put every pinned XSD and every source a pin table
 * names in the cache, then derive its renderings, each checked against its SHA-256.
 *
 * Nothing is requested when `xmllint` does not run. The renderings are derived only once every
 * source is in place. The downloads use the `HttpClient` the caller provides, a status other than
 * 2xx counting as a failure. The scratch directories the files are written to are removed when the
 * run ends, however it ends.
 *
 * @param table - The pin table, `pins` from `#pantry/test/spec-cache/pins.ts` for the cache itself.
 * @param xsds - The XSD pin table, `sources` from `#pantry/vocab/derive/sources.ts` for the cache
 *   itself, fetched first by `fetchPinned`.
 * @returns What the run did with each XSD, source and rendering; a {@link SpecXmllintUnavailable}
 *   before any request, `fetchPinned`'s failure, a {@link SpecFetchIncomplete} naming each source
 *   that could not be settled once every source was attempted, a {@link SpecRenderIncomplete}
 *   naming each rendering that could not be derived once every rendering was attempted, or the
 *   file system's failure.
 */
export const fetchSpecs = Effect.fn("test.specCache.fetchSpecs")(function* fetchSpecs(
  table: SpecPins,
  xsds: XsdPins,
) {
  yield* requireXmllint();

  const report = yield* fetchPinned(xsds);
  const fs = yield* FileSystem.FileSystem;
  const paths = yield* Path.Path;
  const directory = yield* cacheDirectory;
  const client = (yield* HttpClient.HttpClient).pipe(HttpClient.filterStatusOk);

  yield* Effect.annotateCurrentSpan({
    directory,
    pinned: table.sources.length,
    renderings: table.renderings.length,
  });
  yield* fs.makeDirectory(directory, { recursive: true });

  const scratch = yield* fs.makeTempDirectoryScoped({ directory, prefix: ".fetch-specs-" });
  const results = yield* Effect.forEach(
    table.sources,
    (source, index) =>
      settle(source, paths.join(scratch, String(index)), directory, client).pipe(
        Effect.map((outcome): Result.Result<Settled, SpecFailure> => Result.succeed(outcome)),
        // A source's own failure is kept and the others go on; a file system failure ends the run.
        Effect.catchTags({ SpecDownloadFailed: keptFailure, SpecPublishedChanged: keptFailure }),
        Effect.map((result) => ({ path: source.path, result })),
      ),
    { concurrency },
  );
  const failures = results.flatMap(({ result }) =>
    Result.isFailure(result) ? [result.failure] : [],
  );

  if (failures.length > 0) {
    return yield* new SpecFetchIncomplete({ directory, failures, pinned: results.length });
  }

  const derived = yield* Effect.forEach(
    table.renderings,
    (rendering, index) =>
      derive(rendering, paths.join(scratch, `rendering-${String(index)}`), directory).pipe(
        Effect.map((outcome): Result.Result<Rendered, RenderingFailure> => Result.succeed(outcome)),
        // A rendering's own failure is kept and the others go on; a file system failure ends the run.
        Effect.catchTags({
          SpecRenderingChanged: keptRenderingFailure,
          SpecRenderingUndecodable: keptRenderingFailure,
        }),
        Effect.map((result) => ({ path: rendering.path, result })),
      ),
    // One at a time: each rendering holds its source, up to 37 MB, and its text in memory.
    { concurrency: 1 },
  );
  const refused = derived.flatMap(({ result }) =>
    Result.isFailure(result) ? [result.failure] : [],
  );

  if (refused.length > 0) {
    return yield* new SpecRenderIncomplete({
      directory,
      failures: refused,
      pinned: derived.length,
    });
  }

  return {
    directory,
    renderings: derived.flatMap(({ path, result }) =>
      Result.isSuccess(result) ? [{ outcome: result.success, path }] : [],
    ),
    settled: results.flatMap(({ path, result }) =>
      Result.isSuccess(result) ? [{ outcome: result.success, path }] : [],
    ),
    xsds: report,
  } satisfies SpecReport;
}, Effect.scoped);

/**
 * Count the files a run did one of some things with.
 *
 * @param held - The files, each with what the run did with it.
 * @param outcomes - The outcomes counted.
 * @returns How many of the files have one of them.
 */
const count = (
  held: readonly { readonly outcome: Settled | Rendered }[],
  ...outcomes: readonly (Settled | Rendered)[]
): number => held.filter(({ outcome }) => outcomes.includes(outcome)).length;

/**
 * Write the closing line of a run that settled every pin.
 *
 * @param report - What the run did.
 * @returns How many pinned files are in the cache, and how many of them the run downloaded,
 *   rendered or found present.
 */
export const summaryOf = (report: SpecReport): string => {
  const downloads = [...report.xsds.settled, ...report.settled];
  const total = downloads.length + report.renderings.length;
  const downloaded = count(downloads, "fetched", "replaced");
  const rendered = count(report.renderings, "derived", "replaced");
  const present = count([...downloads, ...report.renderings], "present");

  return `All ${String(total)} pinned files are in ${report.directory} and match their SHA-256 pins: ${String(downloaded)} downloaded, ${String(rendered)} rendered, ${String(present)} already present.`;
};

/**
 * The command line: `fetch-specs` fills the spec cache and prints one line per file, then a
 * summary.
 */
const command = Command.make(
  "fetch-specs",
  {},
  Effect.fn("test.specCache.fetchSpecsCommand")(function* fillSpecCache() {
    const paths = yield* Path.Path;
    const report = yield* fetchSpecs(pins, sources);
    const xsdDirectory = paths.relative(report.directory, report.xsds.directory);
    const files = [
      ...report.xsds.settled.map(({ outcome, path }) => ({
        outcome,
        path: paths.join(xsdDirectory, path),
      })),
      ...report.settled,
      ...report.renderings,
    ];

    for (const { outcome, path } of files) {
      yield* Console.log(`${outcome.padEnd(8)} ${path}`);
    }

    yield* Console.log(summaryOf(report));
  }),
).pipe(
  Command.withDescription(
    "Fill ~/.cache/gr8des with the XSDs and specification sources the tests pin, and derive the text renderings, checking each against its SHA-256. A file already there that matches its pin is kept. Nothing is fetched unless xmllint runs.",
  ),
);

if (import.meta.main) {
  NodeRuntime.runMain(
    Command.run(command, { version: "0.0.0" }).pipe(
      Effect.provide(Layer.mergeAll(NodeServices.layer, Digest.layerWebCrypto, downloadClient)),
    ),
  );
}

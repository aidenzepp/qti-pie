/* oxlint-disable unicorn/throw-new-error -- Schema.TaggedError is a schema class factory. */
/**
 * Download every specification source the spec cache pins, `~/.cache/gr8des/`, checking each file
 * against its SHA-256 pin.
 *
 * A cached file that hashes to its pin is kept, and no request is made for it. An absent file, or
 * one whose bytes differ from its pin, is downloaded, and the download is written only when it
 * hashes to the pin, into a scratch directory inside the cache and then renamed into place, so the
 * cache never holds a partial or unpinned file under a pinned path. Every pin is attempted; the run
 * then fails naming each one it could not settle, and a second run requests only those. It writes
 * only under {@link cacheDirectory} and touches no database.
 *
 * The downloads follow the XSD fetcher's, `#pantry/vocab/derive/fetch-xsds.ts`, and share its
 * limits and its account of a failed request.
 *
 * @see {@link https://github.com/aidenzepp/qti-pie/issues/98 | qti-pie#98, a script that fills the spec caches}
 */
import { Effect, FileSystem, Option, Path, Result, Schema } from "effect";
import { Digest } from "effect/crypto";
import { HttpClient } from "effect/http";
import { cacheDirectory } from "#pantry/test/spec-cache/pins.ts";
import type { FetchedSource, SpecPins } from "#pantry/test/spec-cache/pins.ts";
import { concurrency, downloadTimeout, reasonOf } from "#pantry/vocab/derive/fetch-xsds.ts";
import type { FetchReport, Settled } from "#pantry/vocab/derive/fetch-xsds.ts";

/**
 * The command that fills the spec cache, which the errors name as the repair.
 */
export const fetchSpecsCommand = "pnpm --filter @qti-pie/pantry run fetch-specs";

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

  const fs = yield* FileSystem.FileSystem;
  const paths = yield* Path.Path;
  const digest = yield* Digest.Digest;
  const destination = paths.join(directory, path);
  const cached = yield* fs.readFile(destination).pipe(
    Effect.map(Option.some),
    Effect.catchIf(
      (error) => error.reason._tag === "NotFound",
      () => Effect.succeedNone,
    ),
  );
  const staleCopy = Option.isSome(cached);

  if (staleCopy && (yield* digest.digestHex(Digest.sha256, cached.value)) === sha256) {
    return "present" satisfies Settled;
  }

  const bytes = yield* client.get(url).pipe(
    Effect.flatMap((response) => response.arrayBuffer),
    Effect.map((buffer) => new Uint8Array(buffer)),
    Effect.timeout(downloadTimeout),
    Effect.mapError(
      (error) => new SpecDownloadFailed({ path, reason: reasonOf(error), staleCopy, url }),
    ),
  );
  const actual = yield* digest.digestHex(Digest.sha256, bytes);

  if (actual !== sha256) {
    return yield* new SpecPublishedChanged({ actual, expected: sha256, path, staleCopy, url });
  }

  yield* fs.makeDirectory(paths.dirname(destination), { recursive: true });
  yield* fs.writeFile(scratch, bytes);
  yield* fs.rename(scratch, destination);

  return staleCopy ? ("replaced" satisfies Settled) : ("fetched" satisfies Settled);
});

/**
 * Put every source a pin table names in the spec cache, each checked against its SHA-256.
 *
 * The downloads use the `HttpClient` the caller provides, a status other than 2xx counting as a
 * failure. The scratch directory the downloads are written to is removed when the run ends,
 * however it ends.
 *
 * @param table - The pin table, `pins` from `#pantry/test/spec-cache/pins.ts` for the cache itself;
 *   its sources are settled, its renderings left alone.
 * @returns What the run did with each source, in the table's order; a {@link SpecFetchIncomplete}
 *   naming each source that could not be settled once every source was attempted, or the file
 *   system's failure.
 */
export const fetchSpecs = Effect.fn("test.specCache.fetchSpecs")(function* fetchSpecs(
  table: SpecPins,
) {
  const fs = yield* FileSystem.FileSystem;
  const paths = yield* Path.Path;
  const directory = yield* cacheDirectory;
  const client = (yield* HttpClient.HttpClient).pipe(HttpClient.filterStatusOk);

  yield* Effect.annotateCurrentSpan({ directory, pinned: table.sources.length });
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

  return {
    directory,
    settled: results.flatMap(({ path, result }) =>
      Result.isSuccess(result) ? [{ outcome: result.success, path }] : [],
    ),
  } satisfies FetchReport;
}, Effect.scoped);

/**
 * A cache of `xmllint`'s reports on probe batches, under the package's git-ignored `work/`.
 *
 * A batch's report is a pure function of what the validator is and reads: its own account of its
 * version, every pinned XSD the catalog maps, the catalog, the driver schema and the batch. The
 * cache keys each report by the SHA-256 of all of them ({@link verdictKeyText}), so a change to any
 * one is a miss, and a miss runs `xmllint` as an uncached run does. The report is kept as the
 * validator wrote it, not as the oracle read it, so a change to the reader reads the kept report
 * anew. A report names the folder its batch was written in; the cache keeps it with that folder
 * read as a placeholder, so a run in another scratch folder reads it back as its own.
 *
 * Nothing evicts an entry: a key no run asks for again is a file no run reads. Removing
 * `work/xmllint-verdicts` costs one uncached run.
 */
import path from "node:path";
import { Effect, FileSystem, Option, Random, Schema } from "effect";
import { Digest } from "effect/crypto";
import { workRoot } from "#pantry/test/scratch.ts";
import { sourcePaths } from "#pantry/vocab/derive/sources.ts";
import type { SourcePath } from "#pantry/vocab/derive/sources.ts";
import { xmllintRun } from "#pantry/xml/oracle.ts";
import type { XmllintReport } from "#pantry/xml/oracle.ts";

/**
 * The folder the cache keeps its reports in, one file per key.
 */
export const verdictCacheRoot = path.join(workRoot, "xmllint-verdicts");

/**
 * Everything a batch's report depends on, each as the run writes or reads it: the validator's
 * account of its version, each pinned XSD's SHA-256 by its path, the catalog's text, the driver
 * schema's text and the batch's text.
 */
export interface VerdictInputs {
  readonly batch: string;
  readonly catalog: string;
  readonly driver: string;
  readonly pins: readonly (readonly [SourcePath, string])[];
  readonly xmllint: string;
}

/**
 * Write the text a batch's key digests: the run's arguments, then each input, in a fixed order,
 * as one JSON array, so two inputs that differ anywhere write two texts.
 *
 * @param inputs - What the batch's report depends on.
 * @returns The text.
 */
export const verdictKeyText = (inputs: VerdictInputs): string =>
  JSON.stringify([
    "xmllint --nonet --noout --schema driver.xsd batch.xml, XML_CATALOG_FILES=catalog.xml",
    inputs.xmllint,
    inputs.pins,
    inputs.catalog,
    inputs.driver,
    inputs.batch,
  ]);

/**
 * Key a batch's report: the SHA-256 of {@link verdictKeyText}, in hex.
 *
 * @param inputs - What the batch's report depends on.
 * @returns The key.
 */
export const verdictKey = Effect.fn("test.verdictCache.verdictKey")(function* verdictKey(
  inputs: VerdictInputs,
) {
  const digest = yield* Digest.Digest;

  return yield* digest.digestHex(Digest.sha256, new TextEncoder().encode(verdictKeyText(inputs)));
});

/**
 * Read the validator's account of itself: what `xmllint --version` writes, its libxml2 version and
 * the features it was built with.
 *
 * @returns The account, standard output then standard error.
 */
export const xmllintVersion = Effect.fn("test.verdictCache.xmllintVersion")(
  function* xmllintVersion() {
    const run = yield* xmllintRun(["--version"]);

    return `${new TextDecoder().decode(run.stdout)}${run.stderr}`;
  },
);

/**
 * Digest every pinned XSD as it stands in the cache, the bytes the catalog hands the validator.
 *
 * @param directory - The XSD cache.
 * @returns Each pin's path and the SHA-256 of its file, in hex, in {@link sourcePaths} order.
 */
export const pinDigestsOf = Effect.fn("test.verdictCache.pinDigestsOf")(function* pinDigestsOf(
  directory: string,
) {
  const fs = yield* FileSystem.FileSystem;
  const digest = yield* Digest.Digest;

  return yield* Effect.forEach(
    sourcePaths,
    (source) =>
      Effect.gen(function* digestPin() {
        const bytes = yield* fs.readFile(`${directory}/${source}`);

        return [source, yield* digest.digestHex(Digest.sha256, bytes)] as const;
      }),
    { concurrency: 4 },
  );
});

/**
 * The placeholder a kept report holds where its run's folder stood, a character no report holds.
 */
const folderMark = "\u0000folder\u0000";

/**
 * A kept report, as its file holds it.
 */
const Kept = Schema.fromJsonString(Schema.Struct({ code: Schema.Int, report: Schema.String }));

/**
 * Read a batch's report from the cache, or run the validator and keep its report there.
 *
 * A file that holds no kept report, as one a run stopped while writing, is a miss. A new report is
 * written to a file of its own and renamed into place, so a reader never reads half of one, and
 * two runs that keep one key at once keep one report.
 *
 * @param root - The cache's folder.
 * @param key - The batch's key, {@link verdictKey}.
 * @param folder - The folder the run writes the batch in, which the report names.
 * @param run - The validator's run over the batch, for a miss.
 * @returns The report, the kept one read with `folder` where its run's folder stood.
 */
export const cachedReport = Effect.fn("test.verdictCache.cachedReport")(function* cachedReport<
  E,
  R,
>(root: string, key: string, folder: string, run: Effect.Effect<XmllintReport, E, R>) {
  const fs = yield* FileSystem.FileSystem;
  const file = path.join(root, `${key}.json`);
  const kept = (yield* Effect.option(fs.readFileString(file))).pipe(
    Option.flatMap(Schema.decodeUnknownOption(Kept)),
  );

  if (Option.isSome(kept)) {
    return { code: kept.value.code, report: kept.value.report.replaceAll(folderMark, folder) };
  }

  const fresh = yield* run;
  const written = `${file}.${String(process.pid)}.${String(yield* Random.nextInt)}.tmp`;

  yield* fs.makeDirectory(root, { recursive: true });
  yield* fs.writeFileString(
    written,
    JSON.stringify({ code: fresh.code, report: fresh.report.replaceAll(folder, folderMark) }),
  );
  yield* fs.rename(written, file);

  return fresh;
});

/**
 * Regenerates the features file, `src/ledger/features.generated.json`, from the conformance text
 * cached at `$HOME/.cache/gr8des/qti3-text/conf.txt`.
 *
 * From the repository root:
 *
 * ```sh
 * node packages/plate/scripts/features.ts && pnpm exec vp fmt packages/plate/src/ledger/features.generated.json
 * ```
 */
/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown, so the rule's "call without new" reading does not apply. */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { Console, Effect, Schema } from "effect";
import { confPath, generateFeatures } from "#plate/ledger/features.ts";

/**
 * Where the generated file goes.
 */
const output = fileURLToPath(new URL("../src/ledger/features.generated.json", import.meta.url));

/**
 * The conformance text could not be read.
 */
class ConfUnreadable extends Schema.TaggedError<ConfUnreadable>()("ConfUnreadable", {
  path: Schema.String,
}) {
  /**
   * What failed and what to do about it.
   */
  override get message(): string {
    return `Cannot read ${this.path}. Fetch the 1EdTech QTI 3.0 Conformance and Certification text there as conf.txt, or set HOME to the home folder that holds .cache/gr8des.`;
  }
}

/**
 * The features file could not be written.
 */
class OutputUnwritable extends Schema.TaggedError<OutputUnwritable>()("OutputUnwritable", {
  path: Schema.String,
}) {
  /**
   * What failed and what to do about it.
   */
  override get message(): string {
    return `Cannot write ${this.path}. Make its folder writable and run the script again.`;
  }
}

/**
 * Read the conformance text, generate the rows and write them as JSON.
 */
const program = Effect.gen(function* regenerate() {
  const path = yield* confPath;
  const conf = yield* Effect.tryPromise({
    catch: () => new ConfUnreadable({ path }),
    try: () => readFile(path, "utf-8"),
  });
  const rows = generateFeatures(conf);

  yield* Effect.tryPromise({
    catch: () => new OutputUnwritable({ path: output }),
    try: () => writeFile(output, `${JSON.stringify(rows, undefined, 2)}\n`),
  });
  yield* Console.log(`Wrote ${rows.length} features to ${output}.`);
});

await Effect.runPromise(program);

/**
 * Regenerates the block table, `src/model/blocks.generated.json`, from XML Schema Part 2: Datatypes
 * Second Edition, cached at `$HOME/.cache/gr8des/w3c/xmlschema-2-20041028.html`.
 *
 * From the repository root:
 *
 * ```sh
 * node packages/plate/scripts/blocks.ts && pnpm exec vp fmt packages/plate/src/model/blocks.generated.json
 * ```
 *
 * A `BlockTableUnreadable` names what the HTML lacks; point the script at the Recommendation
 * `xsdPart2Sha256` names, or update `generateBlocks` in `src/model/blocks.ts`.
 */
/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown, so the rule's "call without new" reading does not apply. */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { Config, Console, Effect, Schema } from "effect";
import { generateBlocks, xsdPart2CachePath } from "#plate/model/blocks.ts";

/**
 * Where the generated file goes.
 */
const output = fileURLToPath(new URL("../src/model/blocks.generated.json", import.meta.url));

/**
 * Where the Recommendation is cached: {@link xsdPart2CachePath} under `HOME`.
 */
const xsdPart2Path = Config.NonEmptyString("HOME").pipe(
  Config.map((home) => `${home}/${xsdPart2CachePath}`),
);

/**
 * The cached Recommendation could not be read.
 */
class XsdPart2Unreadable extends Schema.TaggedError<XsdPart2Unreadable>()("XsdPart2Unreadable", {
  path: Schema.String,
}) {
  /**
   * What failed and what to do about it.
   */
  override get message(): string {
    return `Cannot read ${this.path}. Fetch XML Schema Part 2: Datatypes Second Edition (https://www.w3.org/TR/2004/REC-xmlschema-2-20041028/) there as xmlschema-2-20041028.html, or set HOME to the home folder that holds .cache/gr8des.`;
  }
}

/**
 * The block table could not be written.
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
 * Read the Recommendation, generate the block table and write it as JSON.
 */
const program = Effect.gen(function* regenerate() {
  const path = yield* xsdPart2Path;
  const html = yield* Effect.tryPromise({
    catch: () => new XsdPart2Unreadable({ path }),
    try: () => readFile(path, "utf-8"),
  });
  const rows = yield* Effect.fromResult(generateBlocks(html));

  yield* Effect.tryPromise({
    catch: () => new OutputUnwritable({ path: output }),
    try: () => writeFile(output, `${JSON.stringify(rows, undefined, 2)}\n`),
  });
  yield* Console.log(`Wrote ${rows.length} blocks to ${output}.`);
});

await Effect.runPromise(program);

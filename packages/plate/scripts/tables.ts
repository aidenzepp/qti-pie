/**
 * Regenerates the tables file, `src/validate/tables.generated.json`, from the QTI 3.0 ASI XSD
 * cached at `$HOME/.cache/gr8des/qti3/xsd/imsqti_asiv3p0p1_v1p0.xsd`.
 *
 * From the repository root:
 *
 * ```sh
 * node packages/plate/scripts/tables.ts && pnpm exec vp fmt packages/plate/src/validate/tables.generated.json
 * ```
 *
 * A `TableGenerationError` names an XSD construct `generateTables` has no table form for; map it in
 * `src/validate/xsd.ts` before committing tables from that XSD.
 */
/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown, so the rule's "call without new" reading does not apply. */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { Config, Console, Effect, Schema } from "effect";
import { readSource } from "#plate/document/read.ts";
import { generateTables, Tables } from "#plate/validate/xsd.ts";

/**
 * Where the XSD is cached: `.cache/gr8des/qti3/xsd/imsqti_asiv3p0p1_v1p0.xsd` under `HOME`, the
 * path `xsdPath` in `src/validate/tables.ts` names.
 *
 * The script spells it here rather than import it, because `src/validate/tables.ts` decodes the
 * committed tables when it loads: after a change to the tables' Schema the old file no longer
 * decodes, and importing it would stop the regeneration that replaces it.
 */
const xsdPath = Config.String("HOME").pipe(
  Config.map((home) => `${home}/.cache/gr8des/qti3/xsd/imsqti_asiv3p0p1_v1p0.xsd`),
);

/**
 * Where the generated file goes.
 */
const output = fileURLToPath(new URL("../src/validate/tables.generated.json", import.meta.url));

/**
 * The XSD could not be read.
 */
class XsdUnreadable extends Schema.TaggedError<XsdUnreadable>()("XsdUnreadable", {
  path: Schema.String,
}) {
  /**
   * What failed and what to do about it.
   */
  override get message(): string {
    return `Cannot read ${this.path}. Fetch the 1EdTech QTI 3.0 ASI XSD there as imsqti_asiv3p0p1_v1p0.xsd, or set HOME to the home folder that holds .cache/gr8des.`;
  }
}

/**
 * The shared reader refused the XSD.
 */
class XsdRefused extends Schema.TaggedError<XsdRefused>()("XsdRefused", {
  path: Schema.String,
  rule: Schema.String,
}) {
  /**
   * What failed and what to do about it.
   */
  override get message(): string {
    return `The reader refused ${this.path} under ${this.rule}. Replace it with the 1EdTech QTI 3.0 ASI XSD whose SHA-256 is xsdSha256 in src/validate/tables.ts.`;
  }
}

/**
 * The tables file could not be written.
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
 * Read the XSD, generate its tables and write them as JSON.
 */
const program = Effect.gen(function* regenerate() {
  const path = yield* xsdPath;
  const bytes = yield* Effect.tryPromise({
    catch: () => new XsdUnreadable({ path }),
    try: () => readFile(path),
  });
  const source = yield* readSource(path, bytes).pipe(
    Effect.mapError((refusal) => new XsdRefused({ path, rule: refusal.rule })),
  );
  const tables = yield* Schema.encodeEffect(Tables)(yield* generateTables(source));

  yield* Effect.tryPromise({
    catch: () => new OutputUnwritable({ path: output }),
    try: () => writeFile(output, `${JSON.stringify(tables, undefined, 2)}\n`),
  });
  yield* Console.log(`Wrote ${Object.keys(tables.elements).length} element tables to ${output}.`);
});

await Effect.runPromise(program);

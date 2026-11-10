/**
 * Regenerates the securing tables file, `src/validate/securing-tables.generated.json`, from the
 * committed full tables, `src/validate/tables.generated.json`. Run it after regenerating the full
 * tables, from the repository root:
 *
 * ```sh
 * node packages/plate/scripts/securing-tables.ts && pnpm exec vp fmt packages/plate/src/validate/securing-tables.generated.json
 * ```
 *
 * It reads no XSD: the projection is a function of the committed tables alone
 * (`projectSecuringTables` in `src/validate/securing.ts`).
 */
/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown, so the rule's "call without new" reading does not apply. */
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { Console, Effect, Schema } from "effect";
import { projectSecuringTables } from "#plate/validate/securing.ts";
import { tables } from "#plate/validate/tables.ts";

/**
 * Where the generated file goes.
 */
const output = fileURLToPath(
  new URL("../src/validate/securing-tables.generated.json", import.meta.url),
);

/**
 * The securing tables file could not be written.
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
 * Project the committed full tables and write the projection as JSON.
 */
const program = Effect.gen(function* regenerate() {
  const file = projectSecuringTables(tables);

  yield* Effect.tryPromise({
    catch: () => new OutputUnwritable({ path: output }),
    try: () => writeFile(output, `${JSON.stringify(file, undefined, 2)}\n`),
  });
  yield* Console.log(
    `Wrote the securing tables of ${String(Object.keys(file.elements).length)} elements and ${String(Object.keys(file.types).length)} types to ${output}.`,
  );
});

await Effect.runPromise(program);

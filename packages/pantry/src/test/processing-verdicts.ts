/**
 * The verdict the import gives each processing package of one hand-written document (Q5.10):
 * `import/program.oracle.db.test.ts` holds PostgreSQL to it, and
 * `processing-verdicts.oracle.test.ts` holds the law oracle to it with no database.
 *
 * A package takes its document's frozen verdict (`fixtures/processing/verdicts.tsv`, the old
 * processing checker run once over every document and frozen): a checker's rule or `accepted`, or a
 * guard's, which the guard's law gives today. The one exception is a package the codec refuses
 * before any row exists ({@link codecRefusals}): no law reads it, so its verdict is the codec's
 * rule. A package with no frozen row (`processing-item`, `rptemplates`, `template-item` and the
 * two padded ones) has no stated verdict: the lookup answers `None` for it, and
 * `import/program.oracle.db.test.ts` holds PostgreSQL to the law oracle's verdict on it instead.
 */
import path from "node:path";
import { Effect, FileSystem, Option, Schema } from "effect";
import type { Rule } from "#pantry/import/refusal.ts";

/**
 * One package's verdict: the rule it is refused under, or `accepted`, and what gives it.
 */
export interface ProcessingVerdict {
  /**
   * The rule the package is refused under, or `accepted`.
   */
  readonly rule: string;
  /**
   * What gives the verdict: the old checker's frozen rule, a guard's law, or the codec.
   */
  readonly source: "checker" | "codec" | "guard";
}

/**
 * The packages the codec refuses before any row exists, by the rule it refuses them under.
 *
 * `p29-test-variables-weight-integer` is a bare `qti-outcome-processing`, kept as written
 * (`processing-fixtures.ts` `handWritten`) and listed as `simple`'s item. No resource type lists a
 * document rooted there: `RootOfType` (`grammar/facets.ts`, spec readings 93 and 114) pairs
 * `qti-outcome-processing` with no type. So the document node's model, which admits exactly the
 * manifest's root and `RootOfType`'s roots (`documentRoots`), has no place for it, and shred
 * refuses it as `unmodeled-vocabulary`. The law oracle refuses it the same way. Its frozen P29 is
 * the document's verdict, judged under the test environment its comment names, which
 * `overlays/expressions.test.ts` writes around it.
 */
export const codecRefusals: ReadonlyMap<string, Rule> = new Map([
  ["p29-test-variables-weight-integer", "unmodeled-vocabulary"],
]);

/**
 * The frozen verdicts' file.
 */
const verdictsFile = path.resolve(import.meta.dirname, "fixtures", "processing", "verdicts.tsv");

/**
 * Who gave a frozen verdict, its `source` column.
 */
const FrozenSource = Schema.Literals(["checker", "guard"]);

/**
 * Read the stated verdicts, as a lookup by the package's name: the stem of its document's file
 * under `broken/` or `guards/`. It answers `None` for a package with no frozen row, which has no
 * stated verdict.
 */
export const processingVerdicts = Effect.gen(function* processingVerdicts() {
  const fs = yield* FileSystem.FileSystem;
  const text = yield* fs.readFileString(verdictsFile);
  const stated = yield* Effect.forEach(
    text.split("\n").slice(1),
    Effect.fnUntraced(function* verdictOfLine(line) {
      const fields = line.split("\t");
      const name = /^(?:broken|guards)\/(?<name>[^/]+)\.xml$/u.exec(fields[0] ?? "")?.groups?.[
        "name"
      ];
      if (name === undefined) {
        return [];
      }

      const codec = codecRefusals.get(name);
      const verdict: ProcessingVerdict =
        codec === undefined
          ? {
              rule: fields[2] ?? "",
              source: yield* Schema.decodeUnknownEffect(FrozenSource)(fields[5]),
            }
          : { rule: codec, source: "codec" };

      return [[name, verdict] as const];
    }),
  );

  const byName: ReadonlyMap<string, ProcessingVerdict> = new Map(stated.flat());

  return (name: string): Option.Option<ProcessingVerdict> =>
    Option.fromUndefinedOr(byName.get(name));
});

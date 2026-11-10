/**
 * The law-name dictionary's generator: `#pantry/vocab/law-names.json` from the schema's own naming
 * of its laws (`#pantry/test/law-namer.ts`) and the id grizzle's `lawIdsOf(Qti)` gives each, the
 * key a refused law carries (grizzle's `RefusedLaw.id`): a law of the theory's LawId, a text
 * pattern law's LawId under its installed domain, and a generated field's law's GeneratedLawId.
 * `law-names.committed.test.ts` holds the committed file to it.
 *
 * The dictionary stays because a refusal carries its law and that id, never the name pantry's law
 * table gives it: the name is the schema's naming, which only the schema's law model computes, and
 * the importer names a refusal without building the schema (`#pantry/import/refusal.ts`).
 *
 * Run it with this package's own install, `GR8DES_QTI_INSTALL` unset, from the package's folder:
 * `node src/test/law-names.ts` writes the file.
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { sameLaw } from "@bjornpagen/grizzle";
import type { Law } from "@bjornpagen/grizzle";
import { Array as Arr, Function as Fn, Option } from "effect";
import type { LawNamesFile, RefusalLaw } from "#pantry/import/refusal.ts";
import { Qti } from "#pantry/qti/own.ts";
import { bucketOf, schemaLawIdsOf, schemaLawNameOf } from "#pantry/test/law-namer.ts";

/**
 * The laws of `lawIdsOf(Qti)`, each with its id, grouped by bucket (`#pantry/test/law-namer.ts`
 * `bucketOf`) for the search {@link lawIdOf} makes. Built at its first read, which compiles Qti's
 * law model once with the namer's list (`schemaLawIdsOf`).
 */
const identifiedByBucket = Fn.memoize((schema: typeof Qti) =>
  Arr.groupBy(schemaLawIdsOf(schema), ({ law }) => bucketOf(law)),
);

/**
 * Find a law's id, the one a refusal of it carries: the id `lawIdsOf(Qti)` lists beside the law
 * grizzle's `sameLaw` holds it to be, so a law pantry's own model builds finds its id too.
 *
 * @param law - A law of `lawsOf(Qti)`, or one pantry's own model builds.
 * @returns Its id, or none for a law `Qti` does not state.
 */
export const lawIdOf = (law: Law): Option.Option<string> =>
  Option.map(
    Arr.findFirst(identifiedByBucket(Qti)[bucketOf(law)] ?? [], (held) => sameLaw(held.law, law)),
    ({ id }) => id,
  );

/**
 * Build a law of `lawsOf(Qti)` as a refusal of it carries it, by a statement: the law, and its id
 * ({@link lawIdOf}), empty for a law `Qti` does not state.
 *
 * @param law - A law of `lawsOf(Qti)`.
 * @returns The refused law.
 */
export const refusedOf = (law: Law): RefusalLaw => ({
  by: { kind: "statement" },
  id: Option.getOrElse(lawIdOf(law), () => ""),
  law,
});

/**
 * The committed dictionary's path.
 */
export const lawNamesPath: string = fileURLToPath(
  import.meta.resolve("#pantry/vocab/law-names.json"),
);

/**
 * Sort a record's entries by their keys' code points, so the file is one text for one dictionary.
 *
 * @param record - The record.
 * @returns The same entries, keys in code point order.
 */
const sortedRecord = <A>(record: Readonly<Record<string, A>>): Readonly<Record<string, A>> =>
  Object.fromEntries(Object.entries(record).toSorted(([x], [y]) => (x < y ? -1 : Number(x > y))));

/**
 * Build the dictionary from the schema: under its id, each named law of grizzle's `lawIdsOf(Qti)`
 * but a check, which its own name names. Two laws of one id named apart is a defect of grizzle's
 * ids or of the schema's naming, and the build throws naming it.
 *
 * @returns The dictionary.
 */
export const lawNamesOf = (): LawNamesFile => {
  const laws: Record<string, { readonly name: string }> = {};

  for (const { id, law } of schemaLawIdsOf(Qti)) {
    for (const name of law.kind === "check" ? [] : Option.toArray(schemaLawNameOf(law))) {
      const held = laws[id];
      if (held !== undefined && held.name !== name) {
        throw new Error(
          `Two laws of lawIdsOf(Qti) carry the one id ${id}, named ${held.name} and ${name}: the dictionary cannot name both.`,
        );
      }

      laws[id] = { name };
    }
  }

  return { laws: sortedRecord(laws) };
};

if (import.meta.main) {
  writeFileSync(lawNamesPath, `${JSON.stringify(lawNamesOf(), undefined, 2)}\n`);
}

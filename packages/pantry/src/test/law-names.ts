/**
 * The law-name dictionary's generator: `#pantry/vocab/law-names.json` from the schema's own naming
 * of its laws (`#pantry/test/law-namer.ts`) and the committed migrations snapshot, which records
 * each installed law under its LawId. `law-names.committed.test.ts` holds the committed file to
 * it.
 *
 * Run it with this package's own install, `GR8DES_QTI_INSTALL` unset, from the package's folder:
 * `node src/test/law-names.ts` writes the file.
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { sameLaw } from "@bjornpagen/grizzle";
import type { Law } from "@bjornpagen/grizzle";
import { Array as Arr, Option } from "effect";
import { bucketOf, committedLaws } from "#pantry/import/refusal.ts";
import type { LawNamesFile } from "#pantry/import/refusal.ts";
import { Qti } from "#pantry/qti/own.ts";
import { installedNameOf, schemaLawNameOf, schemaLawsOf } from "#pantry/test/law-namer.ts";

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
 * Build the dictionary from the schema and the committed snapshot: under its LawId, each law of
 * grizzle's `lawsOf(Qti)` the dictionary names (every law but a check, a contract, a generated
 * field and a pattern, which their own fields name) with its name, and each check the schema states
 * with its installed name; and under `Relation.field`, each named pattern law. A law to enter whose
 * LawId the snapshot lacks is a defect of the snapshot's or of this generator's, and the build
 * throws naming it.
 *
 * @returns The dictionary.
 */
export const lawNamesOf = (): LawNamesFile => {
  const buckets = Arr.groupBy(committedLaws, ({ law }) => bucketOf(law));
  const idOf = (law: Law): string =>
    Option.getOrThrowWith(
      Option.map(
        Arr.findFirst(buckets[bucketOf(law)] ?? [], (held) => sameLaw(held.law, law)),
        ({ id }) => id,
      ),
      () =>
        new Error(
          `The committed snapshot describes no law grizzle's sameLaw holds to be this ${law.kind} law of ${bucketOf(law)}.`,
        ),
    );
  const laws: Record<string, LawNamesFile["laws"][string]> = {};
  const patterns: Record<string, string> = {};
  const enter = (id: string, entry: LawNamesFile["laws"][string]): void => {
    const held = laws[id];
    if (held !== undefined && JSON.stringify(held) !== JSON.stringify(entry)) {
      throw new Error(
        `Two laws of lawsOf(Qti) are the snapshot's one law ${id}, named ${JSON.stringify(held)} and ${JSON.stringify(entry)}: the dictionary cannot name both.`,
      );
    }

    laws[id] = entry;
  };

  for (const law of schemaLawsOf(Qti)) {
    if (law.kind === "pattern") {
      for (const name of Option.toArray(schemaLawNameOf(law))) {
        patterns[`${law.relation}.${law.field}`] = name;
      }
    } else if (law.kind === "check") {
      for (const installed of Option.toArray(installedNameOf(Qti, law))) {
        enter(idOf(law), { installed });
      }
    } else if (law.kind !== "contract" && law.kind !== "generated") {
      for (const name of Option.toArray(schemaLawNameOf(law))) {
        enter(idOf(law), { name });
      }
    }
  }

  return { laws: sortedRecord(laws), patterns: sortedRecord(patterns) };
};

if (import.meta.main) {
  writeFileSync(lawNamesPath, `${JSON.stringify(lawNamesOf(), undefined, 2)}\n`);
}

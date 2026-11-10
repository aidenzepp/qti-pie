/**
 * The law-name dictionary's generator: `#pantry/vocab/law-names.json` from the schema's own naming
 * of its laws (`#pantry/test/law-namer.ts`) and the committed migrations snapshot, which records
 * each installed law under its LawId, the key a refused law carries. `law-names.committed.test.ts`
 * holds the committed file to it.
 *
 * Run it with this package's own install, `GR8DES_QTI_INSTALL` unset, from the package's folder:
 * `node src/test/law-names.ts` writes the file.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { sameLaw } from "@bjornpagen/grizzle";
import type { Law } from "@bjornpagen/grizzle";
import { Array as Arr, Option, Predicate, Schema } from "effect";
import { bucketOf } from "#pantry/import/refusal.ts";
import type { LawNamesFile, RefusalLaw } from "#pantry/import/refusal.ts";
import { Qti } from "#pantry/qti/own.ts";
import { schemaLawNameOf, schemaLawsOf } from "#pantry/test/law-namer.ts";

/**
 * The part of a migrations snapshot that gives each installed law its LawId: each level's laws,
 * each described in grizzle's canonical JSON form beside its LawId.
 */
const SnapshotLaws = Schema.fromJsonString(
  Schema.Struct({
    levels: Schema.Array(
      Schema.Struct({
        laws: Schema.Array(Schema.Struct({ described: Schema.Json, law: Schema.String })),
      }),
    ),
  }),
);

/**
 * A value of grizzle's canonical JSON form read back: JSON, but for a bigint where the form holds
 * `~n:<integer>`.
 */
type Revived =
  | null
  | bigint
  | boolean
  | number
  | string
  | readonly Revived[]
  | { readonly [key: string]: Revived };

/**
 * Read a value of grizzle's canonical JSON form back as the value it stands for: a string
 * `~n:<integer>` is that bigint, a string that starts `~~` is the string with one `~` fewer, and
 * every array and record is read member by member (grizzle's `core/canonical.ts`).
 *
 * @param value - A value of the JSON form.
 * @returns The value it stands for.
 */
const fromCanonicalJson = (value: Schema.Json): Revived => {
  if (Predicate.isString(value)) {
    if (/^~n:-?(?:0|[1-9][0-9]*)$/u.test(value)) {
      return BigInt(value.slice(3));
    }

    return value.startsWith("~~") ? value.slice(1) : value;
  }

  if (Array.isArray(value)) {
    return value.map(fromCanonicalJson);
  }

  return value === null || Predicate.isNumber(value) || Predicate.isBoolean(value)
    ? value
    : Object.fromEntries(
        Object.entries(value).map(([key, member]) => [key, fromCanonicalJson(member)]),
      );
};

/**
 * Test whether a value read from the snapshot is a law: a record with a `kind`. The committed test
 * proves the generator's every match `sameLaw` to a law `lawsOf(Qti)` states.
 *
 * @param value - A revived law of the snapshot.
 * @returns Whether it is a law.
 */
const isLaw = (value: Revived): value is Revived & Law =>
  Predicate.hasProperty(value, "kind") && Predicate.isString(value.kind);

/**
 * The committed snapshot's path.
 */
const snapshotPath: string = fileURLToPath(import.meta.resolve("#migrations/qti/snapshot.json"));

/**
 * The installed laws the committed snapshot describes, each with its LawId, grouped by bucket
 * (`#pantry/import/refusal.ts` `bucketOf`) for the search {@link lawIdOf} makes.
 */
const describedByBucket = Arr.groupBy(
  Schema.decodeUnknownSync(SnapshotLaws)(readFileSync(snapshotPath, "utf-8")).levels.flatMap(
    ({ laws }) =>
      laws.flatMap(({ described, law: id }) => {
        const law = fromCanonicalJson(described);

        return isLaw(law) ? [{ id, law }] : [];
      }),
  ),
  ({ law }) => bucketOf(law),
);

/**
 * Find a law's LawId: the id of the law the committed snapshot describes that grizzle's `sameLaw`
 * holds it to be.
 *
 * @param law - A law of `lawsOf(Qti)`.
 * @returns Its LawId, or none for a law the snapshot describes none of.
 */
export const lawIdOf = (law: Law): Option.Option<string> =>
  Option.map(
    Arr.findFirst(describedByBucket[bucketOf(law)] ?? [], (held) => sameLaw(held.law, law)),
    ({ id }) => id,
  );

/**
 * Build a law of `lawsOf(Qti)` as a refusal of it carries it, by a statement: the law, and its
 * LawId, or the law's own text where the snapshot describes no law of it (a check, a contract, a
 * generated field, a pattern), which names it by its own fields.
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
 * Build the dictionary from the schema and the committed snapshot: under its LawId, each named law
 * of grizzle's `lawsOf(Qti)` the dictionary names (every law but a check, a contract, a generated
 * field and a pattern, which their own fields name), and under `Relation.field` each named pattern
 * law. A law to enter whose LawId the snapshot lacks, or two laws the snapshot holds as one, is a
 * defect of the snapshot's or of this generator's, and the build throws naming it.
 *
 * @returns The dictionary.
 */
export const lawNamesOf = (): LawNamesFile => {
  const laws: Record<string, { readonly name: string }> = {};
  const patterns: Record<string, string> = {};

  for (const law of schemaLawsOf(Qti)) {
    for (const name of Option.toArray(schemaLawNameOf(law))) {
      if (law.kind === "pattern") {
        patterns[`${law.relation}.${law.field}`] = name;
      } else if (law.kind !== "check" && law.kind !== "contract" && law.kind !== "generated") {
        const id = Option.getOrThrowWith(
          lawIdOf(law),
          () =>
            new Error(
              `The committed snapshot describes no law grizzle's sameLaw holds to be this ${law.kind} law of ${bucketOf(law)}.`,
            ),
        );
        const held = laws[id];
        if (held !== undefined && held.name !== name) {
          throw new Error(
            `Two laws of lawsOf(Qti) are the snapshot's one law ${id}, named ${held.name} and ${name}: the dictionary cannot name both.`,
          );
        }

        laws[id] = { name };
      }
    }
  }

  return { laws: sortedRecord(laws), patterns: sortedRecord(patterns) };
};

if (import.meta.main) {
  writeFileSync(lawNamesPath, `${JSON.stringify(lawNamesOf(), undefined, 2)}\n`);
}

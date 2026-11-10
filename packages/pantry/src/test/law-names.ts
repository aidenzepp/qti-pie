/**
 * The law-name dictionary's generator: `#pantry/vocab/law-names.json` from the schema's own naming
 * of its laws (`#pantry/test/law-namer.ts`) and the ids the committed migrations give them, the
 * key a refused law carries (grizzle's `RefusedLaw.id`). `law-names.committed.test.ts` holds the
 * committed file to it.
 *
 * The committed snapshot describes each law of the theory beside its LawId. It records no text
 * pattern's LawId but one per domain (`constraintToLaw.domains`), and no generated field's law's
 * GeneratedLawId at all (grizzle's `analysis/theory/description.ts`, `GeneratedFieldLaw`: "which no
 * fingerprinted part of a snapshot holds"), so those two kinds take their ids from the author
 * login's committed served file, whose refusal tables list every pattern law and every generated
 * field's law under the id its refusal carries (grizzle's `served/forms.ts` `ServedKeyLaws`, read
 * by `adapter/witness/keylaw.ts` `keyLawsOf` and `classify.ts` `nativeLaws`).
 *
 * Run it with this package's own install, `GR8DES_QTI_INSTALL` unset, from the package's folder:
 * `node src/test/law-names.ts` writes the file.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { sameLaw } from "@bjornpagen/grizzle";
import type { Law } from "@bjornpagen/grizzle";
import { Array as Arr, Option, Predicate, Schema } from "effect";
import { servedPath } from "#pantry/db/served.ts";
import type { LawNamesFile, RefusalLaw } from "#pantry/import/refusal.ts";
import { Qti } from "#pantry/qti/own.ts";
import { bucketOf, schemaLawNameOf, schemaLawsOf } from "#pantry/test/law-namer.ts";

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
 * (`#pantry/test/law-namer.ts` `bucketOf`) for the search {@link lawIdOf} makes.
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
 * A list of a served file's, as grizzle writes it: the array itself, or, where an item holds a
 * value the file revives at load, the array under `~a` beside the indices of those items under `~`
 * (grizzle's `served/json.ts`).
 *
 * @param item - The items' schema.
 * @returns The list's schema.
 */
const servedList = <S extends Schema.Top>(item: S) =>
  Schema.Union([Schema.Array(item), Schema.Struct({ "~a": Schema.Array(item) })]);

/**
 * Read a served file's list as its items.
 *
 * @param list - The list as the file writes it.
 * @returns Its items.
 */
const itemsOf = <A>(list: readonly A[] | { readonly "~a": readonly A[] }): readonly A[] =>
  "~a" in list ? list["~a"] : list;

/**
 * The part of the author login's served file that gives each text pattern's law and each generated
 * field's law the id its refusal carries: each role's refusal tables, each installed constraint's
 * laws, every pattern law among them by its relation and field, and each generated field's law.
 */
const ServedLawIds = Schema.fromJsonString(
  Schema.Struct({
    roles: servedList(
      Schema.Struct({
        refusals: Schema.Struct({
          laws: Schema.Struct({
            constraintLaws: servedList(
              Schema.Struct({
                laws: servedList(
                  Schema.Struct({
                    described: Schema.Struct({
                      field: Schema.optionalKey(Schema.String),
                      kind: Schema.String,
                      relation: Schema.optionalKey(Schema.String),
                    }),
                    law: Schema.String,
                  }),
                ),
              }),
            ),
            generated: servedList(
              Schema.Struct({
                id: Schema.String,
                law: Schema.Struct({ field: Schema.String, relation: Schema.String }),
              }),
            ),
          }),
        }),
      }),
    ),
  }),
);

/**
 * Key a pattern law or a generated field's law by its kind and its own fields, its relation and
 * field, which name one law of each kind.
 *
 * @param kind - The law's kind.
 * @param relation - Its relation.
 * @param field - Its field.
 * @returns The key.
 */
const fieldLawKey = (kind: "generated" | "pattern", relation: string, field: string): string =>
  `${kind} ${relation}.${field}`;

/**
 * The id of every pattern law and every generated field's law the committed served file lists, by
 * {@link fieldLawKey}.
 */
const servedIdOf: ReadonlyMap<string, string> = new Map(
  itemsOf(Schema.decodeUnknownSync(ServedLawIds)(readFileSync(servedPath, "utf-8")).roles).flatMap(
    ({ refusals: { laws } }) => [
      ...itemsOf(laws.constraintLaws).flatMap((constraint) =>
        itemsOf(constraint.laws).flatMap(({ described: { field, kind, relation }, law }) =>
          kind === "pattern" && field !== undefined && relation !== undefined
            ? [[fieldLawKey("pattern", relation, field), law] as const]
            : [],
        ),
      ),
      ...itemsOf(laws.generated).map(
        ({ id, law }) => [fieldLawKey("generated", law.relation, law.field), id] as const,
      ),
    ],
  ),
);

/**
 * Find a law's id, the one a refusal of it carries: a pattern law's and a generated field's law's
 * the committed served file lists for its relation and field, and any other law's the id of the
 * law the committed snapshot describes that grizzle's `sameLaw` holds it to be.
 *
 * @param law - A law of `lawsOf(Qti)`.
 * @returns Its id, or none for a law the committed migrations give none.
 */
export const lawIdOf = (law: Law): Option.Option<string> =>
  law.kind === "pattern" || law.kind === "generated"
    ? Option.fromUndefinedOr(servedIdOf.get(fieldLawKey(law.kind, law.relation, law.field)))
    : Option.map(
        Arr.findFirst(describedByBucket[bucketOf(law)] ?? [], (held) => sameLaw(held.law, law)),
        ({ id }) => id,
      );

/**
 * Build a law of `lawsOf(Qti)` as a refusal of it carries it, by a statement: the law, and its id
 * ({@link lawIdOf}), empty where the committed migrations give it none.
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
 * Build the dictionary from the schema and the committed migrations: under its id
 * ({@link lawIdOf}), each named law of grizzle's `lawsOf(Qti)` but a check, which its own name
 * names. A law to enter whose id the migrations lack, or two laws they hold as one, is a defect of
 * the migrations' or of this generator's, and the build throws naming it.
 *
 * @returns The dictionary.
 */
export const lawNamesOf = (): LawNamesFile => {
  const laws: Record<string, { readonly name: string }> = {};

  for (const law of schemaLawsOf(Qti)) {
    for (const name of law.kind === "check" ? [] : Option.toArray(schemaLawNameOf(law))) {
      const id = Option.getOrThrowWith(
        lawIdOf(law),
        () =>
          new Error(
            `The committed migrations give no id to this ${law.kind} law of ${bucketOf(law)}: neither the snapshot describes a law grizzle's sameLaw holds it to be, nor does the served file list its relation and field. Run \`grizzle generate\` and this generator again.`,
          ),
      );
      const held = laws[id];
      if (held !== undefined && held.name !== name) {
        throw new Error(
          `Two laws of lawsOf(Qti) are the migrations' one law ${id}, named ${held.name} and ${name}: the dictionary cannot name both.`,
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

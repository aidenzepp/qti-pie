/**
 * The keys a package's rows break, judged on the host before any row is written: every key `Qti`
 * states over a relation the import writes as flat rows, evaluated over the rows `readProgram`
 * builds, each named by its law (`#pantry/import/refusal.ts` `lawNameOf`).
 *
 * PostgreSQL checks a key as the statement writes the row, before any deferred law, so a key the
 * rows break is the law a refusal names whatever else breaks. A law oracle that predicts a
 * package's breaches must predict each of these, or the database names a rule the oracle does not.
 *
 * A key is evaluated where it is over a relation itself and its every term is a field the import
 * writes on every row: a key over a selection, a relation the import nests in its owner's row
 * (`Node`'s members, `Package`'s record) and a field grizzle derives (a family's slot) are not read
 * here, and {@link evaluatedKeys} names the keys that are.
 */
import { Option, Schema } from "effect";
import { lawNameOf } from "#pantry/import/refusal.ts";
import type { LawName } from "#pantry/import/refusal.ts";
import type { PackageInputs } from "#pantry/import/write.ts";
import { Qti } from "#pantry/qti/schema.ts";

/**
 * A key law over plain fields: its name, its relation and its fields, in order.
 */
export interface KeyLaw {
  readonly fields: readonly string[];
  readonly law: LawName;
  readonly relation: string;
}

/**
 * One key a package's rows break: the law, and the key's text, which two of its rows share.
 */
export interface KeyBreach extends KeyLaw {
  readonly key: string;
}

/**
 * A key statement over a relation itself, its terms its fields: a key over a selection has a
 * predicate this module does not evaluate, so it is not read.
 */
const PlainKey = Schema.Struct({
  kind: Schema.Literal("key"),
  side: Schema.Struct({
    source: Schema.Struct({ kind: Schema.Literal("relation"), name: Schema.String }),
    terms: Schema.NonEmptyArray(Schema.String),
  }),
});

/**
 * A key's term naming one field of its relation, as an outcome names it.
 *
 * @param field - The field.
 * @returns The term.
 */
const termOf = (field: string) => ({ field, kind: "field" as const });

/**
 * Every key the schema states over a relation itself, with the name of its law as an outcome names
 * it (`lawNameOf`).
 */
export const keyLaws: readonly KeyLaw[] = Qti.statements.flatMap((statement) =>
  Option.match(Schema.decodeUnknownOption(PlainKey)(statement), {
    onNone: () => [],
    onSome: ({ side }) => {
      const [first, ...rest] = side.terms;

      return Option.match(
        lawNameOf({
          kind: "key",
          side: {
            relation: side.source.name,
            selection: { conjuncts: [] },
            terms: [termOf(first), ...rest.map(termOf)],
          },
        }),
        {
          onNone: () => [],
          onSome: (law) => [{ fields: side.terms, law, relation: side.source.name }],
        },
      );
    },
  }),
);

/**
 * A value a key's field holds: a text, a handle, a uuid, a count or a flag.
 */
const KeyValue = Schema.Union([Schema.String, Schema.BigInt, Schema.Number, Schema.Boolean]);

/**
 * Read the key texts of a relation's rows under a key law: none when the import writes the relation
 * as no keyed set of flat rows, or writes a row without every field of the key as a plain value.
 *
 * @param inputs - The package's inputs.
 * @param law - The key law.
 * @returns Each row's key text, in the rows' order.
 */
const keyTextsOf = (inputs: PackageInputs, law: KeyLaw): Option.Option<readonly string[]> => {
  const KeyRows = Schema.ReadonlyMap(
    Schema.String,
    Schema.Struct(Object.fromEntries(law.fields.map((field) => [field, KeyValue]))),
  );
  const [read] = Object.entries(inputs).flatMap(([relation, rows]) =>
    relation === law.relation ? Option.toArray(Schema.decodeUnknownOption(KeyRows)(rows)) : [],
  );

  return read === undefined || read.size === 0
    ? Option.none()
    : Option.some(
        [...read.values()].map((values) =>
          law.fields.map((field) => String(values[field])).join(" "),
        ),
      );
};

/**
 * The key laws a package's rows let this module read: each over a relation with rows, every field
 * of the key written on every row as a plain value.
 *
 * @param inputs - The package's inputs.
 * @returns The laws read.
 */
export const evaluatedKeys = (inputs: PackageInputs): readonly KeyLaw[] =>
  keyLaws.filter((law) => Option.isSome(keyTextsOf(inputs, law)));

/**
 * The keys a package's rows break: for each key law of {@link evaluatedKeys}, the first key text two
 * rows share.
 *
 * @param inputs - The package's inputs.
 * @returns The breaches, one per law broken.
 */
export const keyBreachesOf = (inputs: PackageInputs): readonly KeyBreach[] =>
  keyLaws.flatMap((law) =>
    Option.match(keyTextsOf(inputs, law), {
      onNone: () => [],
      onSome: (keys) => {
        const seen = new Set<string>();
        const repeated = keys.find((key) => {
          const again = seen.has(key);
          seen.add(key);

          return again;
        });

        return repeated === undefined ? [] : [{ ...law, key: repeated }];
      },
    }),
  );

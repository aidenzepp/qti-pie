/**
 * The keys a package's rows break, judged on the host before any row is written: every key `Qti`
 * states over a relation the import writes as flat rows, evaluated over the rows `readProgram`
 * builds, each named by its law (`#pantry/import/refusal.ts` `lawNameOf`).
 *
 * PostgreSQL checks a key as the statement writes the row, before any deferred law, so a key the
 * rows break is the law a refusal names whatever else breaks. A law oracle that predicts a
 * package's breaches must predict each of these, or the database names a rule the oracle does not.
 *
 * A key is evaluated where it is over a relation itself, or over a selection that holds one field
 * to one value (`IdBinding`'s admitted bindings, R2), and its every term is a field the import
 * writes on every row: a key over any other selection, a relation the import nests in its owner's
 * row (`Node`'s members, `Package`'s record) and a field grizzle derives (a family's slot) are not
 * read here, and {@link evaluatedKeys} names the keys that are.
 */
import { Option, Schema } from "effect";
import { lawNameOf } from "#pantry/import/refusal.ts";
import type { LawName } from "#pantry/import/refusal.ts";
import type { PackageInputs } from "#pantry/import/write.ts";
import { Qti } from "#pantry/test/qti.ts";

/**
 * A key law over plain fields: its name, its relation, its fields, in order, and the rows it keys:
 * every row, or those whose one field holds one value (`where`).
 */
export interface KeyLaw {
  readonly fields: readonly string[];
  readonly law: LawName;
  readonly relation: string;
  readonly where: Option.Option<FieldIs>;
}

/**
 * A selection's one conjunct this module evaluates: a field equal to a literal.
 */
interface FieldIs {
  readonly field: string;
  readonly value: boolean | number | string;
}

/**
 * A literal a selection compares a field with.
 */
const Literal = Schema.Union([Schema.Boolean, Schema.Number, Schema.String]);

/**
 * One key a package's rows break: the law, and the key's text, which two of its rows share.
 */
export interface KeyBreach extends KeyLaw {
  readonly key: string;
}

/**
 * A key statement over a relation itself, its terms its fields.
 */
const PlainKey = Schema.Struct({
  kind: Schema.Literal("key"),
  side: Schema.Struct({
    source: Schema.Struct({ kind: Schema.Literal("relation"), name: Schema.String }),
    terms: Schema.NonEmptyArray(Schema.String),
  }),
});

/**
 * A key statement over a selection whose predicate holds one field to one literal, its terms its
 * fields: the selection's relation, and its description's predicate. A key over any other
 * selection has a predicate this module does not evaluate, so it is not read.
 */
const FieldKey = Schema.Struct({
  kind: Schema.Literal("key"),
  side: Schema.Struct({
    source: Schema.Struct({
      desc: Schema.Struct({
        predicate: Schema.Struct({
          kind: Schema.Literal("compare"),
          left: Schema.Struct({ field: Schema.String, kind: Schema.Literal("field") }),
          op: Schema.Literal("eq"),
          right: Schema.Struct({ kind: Schema.Literal("literal"), value: Literal }),
        }),
      }),
      relation: Schema.Struct({ kind: Schema.Literal("relation"), name: Schema.String }),
    }),
    terms: Schema.NonEmptyArray(Schema.String),
  }),
});

/**
 * Read a key statement this module evaluates: its relation, its terms, and the field its
 * selection holds to a value, if any.
 *
 * @param statement - A statement of `Qti`.
 * @returns The key, none for any other statement.
 */
const keyOf = (
  statement: (typeof Qti.statements)[number],
): Option.Option<{
  readonly relation: string;
  readonly terms: readonly [string, ...string[]];
  readonly where: Option.Option<FieldIs>;
}> =>
  Option.orElse(
    Option.map(Schema.decodeUnknownOption(PlainKey)(statement), ({ side }) => ({
      relation: side.source.name,
      terms: side.terms,
      where: Option.none(),
    })),
    () =>
      Option.map(Schema.decodeUnknownOption(FieldKey)(statement), ({ side }) => ({
        relation: side.source.relation.name,
        terms: side.terms,
        where: Option.some({
          field: side.source.desc.predicate.left.field,
          value: side.source.desc.predicate.right.value,
        }),
      })),
  );

/**
 * A key's term naming one field of its relation, as an outcome names it.
 *
 * @param field - The field.
 * @returns The term.
 */
const termOf = (field: string) => ({ field, kind: "field" as const });

/**
 * Every key the schema states over a relation itself or over a selection that holds one field to
 * one value, with the name of its law as an outcome names it (`lawNameOf`).
 */
export const keyLaws: readonly KeyLaw[] = Qti.statements.flatMap((statement) =>
  Option.match(keyOf(statement), {
    onNone: () => [],
    onSome: ({ relation, terms, where }) => {
      const [first, ...rest] = terms;

      return Option.match(
        lawNameOf({
          kind: "key",
          side: {
            relation,
            selection: {
              conjuncts: Option.toArray(where).map(({ field, value }) => ({
                kind: "compare" as const,
                left: termOf(field),
                op: "eq" as const,
                right: { kind: "literal" as const, type: undefined, value },
              })),
            },
            terms: [termOf(first), ...rest.map(termOf)],
          },
        }),
        {
          onNone: () => [],
          onSome: (law) => [{ fields: terms, law, relation, where }],
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
 * Read the key texts of a relation's rows under a key law, those its selection holds where it has
 * one: none when the import writes the relation as no keyed set of flat rows, writes a row without
 * every field the law reads as a plain value, or writes no row the law keys.
 *
 * @param inputs - The package's inputs.
 * @param law - The key law.
 * @returns Each row's key text, in the rows' order.
 */
const keyTextsOf = (inputs: PackageInputs, law: KeyLaw): Option.Option<readonly string[]> => {
  const read = [...law.fields, ...Option.toArray(law.where).map(({ field }) => field)];
  const KeyRows = Schema.ReadonlyMap(
    Schema.String,
    Schema.Struct(Object.fromEntries(read.map((field) => [field, KeyValue]))),
  );
  const [rows] = Object.entries(inputs).flatMap(([relation, written]) =>
    relation === law.relation ? Option.toArray(Schema.decodeUnknownOption(KeyRows)(written)) : [],
  );
  const keyed = [...(rows?.values() ?? [])].filter((values) =>
    Option.match(law.where, {
      onNone: () => true,
      onSome: ({ field, value }) => values[field] === value,
    }),
  );

  return keyed.length === 0
    ? Option.none()
    : Option.some(
        keyed.map((values) => law.fields.map((field) => String(values[field])).join(" ")),
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

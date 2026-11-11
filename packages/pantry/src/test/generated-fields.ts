/**
 * The host's one evaluator of the fields PostgreSQL generates in the composed `Qti`
 * (`relation.generated`): each field's term, as grizzle keeps it in its relation's description,
 * read by the host's one reader of grizzle's terms (`#pantry/test/predicates.ts` `termOf`) and
 * evaluated over a row's written fields, as PostgreSQL computes the column. The import writes no
 * generated field (grizzle refuses one in a write), so every test that holds the import's rows as
 * the database holds them restores them here: the host judge (`#pantry/test/host-judge.ts`), the
 * genetic differential's view (`#pantry/test/gen/genetic/host-laws.ts` `viewOf`), the key-text
 * oracle (`keys.oracle.test.ts`) and the overlay tests. Which fields are generated, and how, is
 * read from the schema, never listed by hand, so a field the schema comes to generate is restored
 * without a word here.
 */
import { Option, Predicate, Schema } from "effect";
import { closedOf, evaluate, StoredTermSchema, termOf } from "#pantry/test/predicates.ts";
import type { Datum, Row } from "#pantry/test/predicates.ts";
import { Qti } from "#pantry/qti/schema.ts";

/**
 * The composed `Qti`'s closed relations, which a generated term's closed reads look up.
 */
const closed = closedOf(Qti.relations);

/**
 * Read a generated field's term as the host evaluates it: the term grizzle keeps at the field's
 * writing in its relation's description, read as a predicate's terms are and evaluated over the
 * row, as PostgreSQL computes the column from the row's written fields.
 *
 * @param expr - The term, as grizzle keeps it.
 * @returns The field's value over a row: unknown where the term reads a field the row lacks, or
 *   holds a term the host does not read (`#pantry/test/predicates.ts` `termOf`).
 * @throws {Error} When grizzle keeps no term there: a defect of this evaluator, which must learn the
 *   description's shape before it restores the field.
 */
// oxlint-disable-next-line anti-slop/no-unknown-parameters -- A description's term is read here, by its shape.
const generatedValueOf = (expr: unknown): ((row: Row) => Datum | undefined) => {
  const term = termOf(Schema.decodeUnknownSync(StoredTermSchema)(expr));

  return (row) => evaluate(term, row, () => false, closed);
};

/**
 * A stored relation's description as grizzle keeps it, for its generated fields: each field's
 * writing, a generated field's with the term PostgreSQL computes it by.
 */
const DescribedSchema = Schema.Struct({
  desc: Schema.Struct({
    fields: Schema.Record(
      Schema.String,
      Schema.Struct({
        writing: Schema.Struct({ expr: Schema.optionalKey(Schema.Unknown), kind: Schema.String }),
      }),
    ),
  }),
  name: Schema.String,
});

/**
 * Every field PostgreSQL generates of each stored relation of the composed schema, by relation and
 * then field: its value over a row ({@link generatedValueOf}), from the term grizzle keeps in the
 * relation's description. A relation that generates no field has no entry. A stored relation's
 * description is read strictly, so a shape grizzle changes fails here, by its decode, rather than
 * leaving a generated field unrestored without a word.
 */
export const generatedFields: ReadonlyMap<
  string,
  ReadonlyMap<string, (row: Row) => Datum | undefined>
> = new Map(
  Object.values(Qti.relations).flatMap((member) => {
    if (!Predicate.hasProperty(member, "kind") || member.kind !== "relation") {
      return [];
    }

    const { desc, name } = Schema.decodeUnknownSync(DescribedSchema)(member);
    const generated = Object.entries(desc.fields).flatMap(([field, { writing }]) =>
      writing.kind === "generated" ? [[field, generatedValueOf(writing.expr)] as const] : [],
    );

    return generated.length === 0 ? [] : [[name, new Map(generated)] as const];
  }),
);

/**
 * Restore a written row's generated fields, each at the value PostgreSQL computes for it
 * ({@link generatedFields}), its written fields as they are. A field whose term is unknown over
 * the row, one that reads a field the row lacks or a term the host does not read, stays absent,
 * so a law that reads it is unknown rather than judged over a value the database would not hold.
 *
 * @param relation - The row's relation.
 * @param row - The row as the import writes it.
 * @returns The row as the database holds it, as far as the host evaluates its generated fields.
 */
export const withGenerated = (relation: string, row: Row): Row =>
  Option.match(Option.fromUndefinedOr(generatedFields.get(relation)), {
    onNone: () => row,
    onSome: (generated) => ({
      ...row,
      ...Object.fromEntries(
        [...generated].flatMap(([field, valueOf]) => {
          const value = valueOf(row);

          return value === undefined ? [] : [[field, value] as const];
        }),
      ),
    }),
  });

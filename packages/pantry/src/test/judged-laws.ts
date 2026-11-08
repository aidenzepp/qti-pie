/**
 * The laws the host judges, each named as grizzle's `lawsOf` names its statement's law, so
 * `src/import/refusal.ts`'s `lawNameOf`, which matches by grizzle's `sameLaw`, names a broken one
 * as it names an outcome's.
 *
 * `#pantry/test/key-copies.ts` reads each statement's laws ({@link judgedOf}) and containments
 * ({@link containmentsIn}) from the statement alone, but an `alternatives`' laws, which it reads
 * from the laws `lawsOf` states for it, since it holds no side; this module pairs each with the law
 * `lawsOf` states for it, and {@link checkConstraintOf} gives a check's installed name from its law.
 * It reads grizzle's values, so the law oracle reaches it from none of its modules: the oracle is a
 * second implementation, and reads no value of grizzle's (`src/grammar/purity.test.ts`).
 */
import { constraintNameOf, lawsOf } from "@bjornpagen/grizzle";
import type { Law, LawSourceSide } from "@bjornpagen/grizzle";
import { Array as Arr, Formatter, Function as Fn } from "effect";
import type { Qti } from "#pantry/qti/schema.ts";
import { containmentsIn, judgedOf } from "#pantry/test/key-copies.ts";
import type { Containment, JudgedLaw } from "#pantry/test/key-copies.ts";

/**
 * Whether two law sides read one side, whatever their selections: one relation, and the same terms
 * in pairing order, each a field, `pred` of one, or a constant of one value.
 *
 * @param stated - A side as grizzle's `lawsOf` names it.
 * @param read - The side as `#pantry/test/key-copies.ts` read it from its statement.
 * @returns Whether they are one side.
 */
const readsSide = (stated: LawSourceSide, read: LawSourceSide): boolean =>
  stated.relation === read.relation &&
  stated.terms.length === read.terms.length &&
  Arr.zip(stated.terms, read.terms).every(([held, term]) => {
    if (held.kind === "constant" || term.kind === "constant") {
      return held.kind === "constant" && term.kind === "constant" && held.value === term.value;
    }

    return held.kind === term.kind && held.field === term.field;
  });

/**
 * Whether a law grizzle's `lawsOf` names for a statement is the law `#pantry/test/key-copies.ts`
 * read from it: a check of one name over one relation, a key over one side, or a containment
 * between one pair of sides, whatever the sides' selections, since that module reads a selection as
 * the predicate the statement holds, not as grizzle's canonical conjuncts.
 *
 * @param stated - The law as `lawsOf` names it.
 * @param read - The law as `#pantry/test/key-copies.ts` read it.
 * @returns Whether they are one law.
 */
const readsLaw = (stated: Law, read: Law): boolean => {
  if (stated.kind === "check" && read.kind === "check") {
    return stated.name === read.name && stated.relation === read.relation;
  }

  if (stated.kind === "key" && read.kind === "key") {
    return readsSide(stated.side, read.side);
  }

  return (
    stated.kind === "contained" &&
    read.kind === "contained" &&
    readsSide(stated.from, read.from) &&
    readsSide(stated.to, read.to)
  );
};

/**
 * Name a law the host judges as grizzle's `lawsOf` names it, its sides' selections included: the
 * one law of its statement's that it reads ({@link readsLaw}).
 *
 * @param judged - The law, a judged law or a containment, as `#pantry/test/key-copies.ts` read it
 *   from its statement.
 * @param laws - The statement's laws, as `lawsOf` names them.
 * @returns The law, holding the statement's own law.
 * @throws {Error} When none or several of the statement's laws are the law read, which `lawsOf`
 *   rules out: a defect of this reader, never of a document.
 */
const statedAs = <Judged extends { readonly law: Law }>(
  judged: Judged,
  laws: readonly Law[],
): Judged => {
  const held = laws.filter((stated) => readsLaw(stated, judged.law));
  if (!Arr.isReadonlyArrayNonEmpty(held) || held.length > 1) {
    throw new Error(
      `The statement read as ${Formatter.format(judged.law)} has ${String(held.length)} laws of grizzle's lawsOf that read its sides, among ${Formatter.format(laws)}. Read each statement's sides as lawsOf pairs them.`,
    );
  }

  return { ...judged, law: Arr.headNonEmpty(held) };
};

/**
 * Each statement of a schema beside its laws, as grizzle's `lawsOf` names them.
 *
 * `lawsOf` compiles the schema's law model, which takes seconds, so this is memoized by the
 * schema: {@link judgedLaws}, {@link containmentsOf} and {@link checksOf} share one compile.
 */
const statementLawsOf = Fn.memoize((schema: typeof Qti) => lawsOf(schema));

/**
 * Every law a schema states that the host judges over rows (`#pantry/test/key-copies.ts`
 * `JudgedLaw`), in statement order, each named as grizzle's `lawsOf` names its statement's law
 * ({@link statedAs}).
 *
 * @param schema - The schema, `Qti`.
 * @returns The laws.
 */
export const judgedLaws: (schema: typeof Qti) => readonly JudgedLaw[] = Fn.memoize(
  (schema: typeof Qti): readonly JudgedLaw[] =>
    statementLawsOf(schema).flatMap(({ laws, statement }) =>
      judgedOf(statement, laws).map((judged) => statedAs(judged, laws)),
    ),
);

/**
 * Read every containment the schema states from one relation (`#pantry/test/key-copies.ts`
 * `containmentsIn`), so a test can judge rows by the schema's own statements, their selections
 * included. Each law is its statement's own, named as {@link judgedLaws} names it
 * ({@link statedAs}), so `src/import/refusal.ts`'s `lawNameOf` names it.
 *
 * @param schema - The schema, `Qti`.
 * @param from - The source relation.
 * @returns The containments, in statement order.
 */
export const containmentsOf = (schema: typeof Qti, from: string): readonly Containment[] =>
  statementLawsOf(schema).flatMap(({ laws, statement }) =>
    containmentsIn(statement, from).map((containment) => statedAs(containment, laws)),
  );

/**
 * A check law, as `lawsOf` names one.
 */
type CheckLaw = Extract<Law, { readonly kind: "check" }>;

/**
 * Each check a schema states, as `lawsOf` names it, by its relation and declared name
 * (`JSON.stringify([relation, name])`): the index {@link checkConstraintOf} reads, built once per
 * schema.
 */
const checksOf = Fn.memoize(
  (schema: typeof Qti): ReadonlyMap<string, CheckLaw> =>
    new Map(
      statementLawsOf(schema)
        .flatMap(({ laws }) => laws)
        .filter((law): law is CheckLaw => law.kind === "check")
        .map((law) => [JSON.stringify([law.relation, law.name]), law]),
    ),
);

/**
 * The name PostgreSQL holds a row check's CHECK constraint under, which a direct SQL writer's
 * refusal by it names (SQLSTATE 23514): grizzle's `constraintNameOf` of the check the schema
 * states on a relation under a declared name, as `lawsOf` names it, so a test takes the name from
 * the installation's own naming and never spells it.
 *
 * The first call compiles the schema's law model ({@link statementLawsOf}), so a test calls this
 * in its body, under its own timeout, never where a run without the lease loads the file.
 *
 * @param schema - The schema, `Qti`.
 * @param relation - The relation the check is declared on, by name.
 * @param name - The check's declared name.
 * @returns The installed name.
 * @throws {Error} When the schema states no check of that name on that relation: a defect of the
 *   test that asks, never of a document.
 */
export const checkConstraintOf = (schema: typeof Qti, relation: string, name: string): string => {
  const law = checksOf(schema).get(JSON.stringify([relation, name]));
  if (law === undefined) {
    throw new Error(
      `The schema states no check ${name} on ${relation} among grizzle's lawsOf, so the installation holds no CHECK for it. Name a check the schema declares on that relation.`,
    );
  }

  return constraintNameOf(law);
};

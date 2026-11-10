/**
 * The laws the host judges, each named as grizzle's `lawsByStatement` names its statement's law, so
 * `src/import/refusal.ts`'s `lawNameOf`, which matches by grizzle's `sameLaw`, names a broken one
 * as it names an outcome's.
 *
 * `#pantry/test/key-copies.ts` reads each statement's laws ({@link judgedOf}) and containments
 * ({@link containmentsIn}) from the statement alone; this module pairs each with the law
 * `lawsByStatement` states for it. It reads grizzle's values, so the law oracle reaches it from
 * none of its modules: the oracle is a second implementation, and reads no value of grizzle's
 * (`src/grammar/purity.test.ts`).
 */
import { lawsByStatement } from "@bjornpagen/grizzle";
import type { Law, LawSide } from "@bjornpagen/grizzle";
import { Array as Arr, Formatter, Function as Fn } from "effect";
import type { Qti } from "#pantry/qti/schema.ts";
import { containmentsIn, judgedOf } from "#pantry/test/key-copies.ts";
import type { Containment, JudgedLaw } from "#pantry/test/key-copies.ts";

/**
 * Whether two law sides read one side, whatever their selections: one relation, and the same terms
 * in pairing order, each a field or `pred` of one.
 *
 * @param stated - A side as grizzle's `lawsByStatement` names it.
 * @param read - The side as `#pantry/test/key-copies.ts` read it from its statement.
 * @returns Whether they are one side.
 */
const readsSide = (stated: LawSide, read: LawSide): boolean =>
  stated.relation === read.relation &&
  stated.terms.length === read.terms.length &&
  Arr.zip(stated.terms, read.terms).every(
    ([held, term]) => held.kind === term.kind && held.field === term.field,
  );

/**
 * Whether a law grizzle's `lawsByStatement` names for a statement is the law
 * `#pantry/test/key-copies.ts` read from it: a check of one name over one relation, a key over one
 * side, or a containment between one pair of sides, whatever the sides' selections, since that
 * module reads a selection as the predicate the statement holds, not as grizzle's canonical
 * conjuncts.
 *
 * @param stated - The law as `lawsByStatement` names it.
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
 * Name a law the host judges as grizzle's `lawsByStatement` names it, its sides' selections
 * included: the one law of its statement's that it reads ({@link readsLaw}).
 *
 * @param judged - The law, a judged law or a containment, as `#pantry/test/key-copies.ts` read it
 *   from its statement.
 * @param laws - The statement's laws, as `lawsByStatement` names them.
 * @returns The law, holding the statement's own law.
 * @throws {Error} When none or several of the statement's laws are the law read, which `lawsByStatement`
 *   rules out: a defect of this reader, never of a document.
 */
const statedAs = <Judged extends { readonly law: Law }>(
  judged: Judged,
  laws: readonly Law[],
): Judged => {
  const held = laws.filter((stated) => readsLaw(stated, judged.law));
  if (!Arr.isReadonlyArrayNonEmpty(held) || held.length > 1) {
    throw new Error(
      `The statement read as ${Formatter.format(judged.law)} has ${String(held.length)} laws of grizzle's lawsByStatement that read its sides, among ${Formatter.format(laws)}. Read each statement's sides as lawsByStatement pairs them.`,
    );
  }

  return { ...judged, law: Arr.headNonEmpty(held) };
};

/**
 * Each statement of a schema beside its laws, as grizzle's `lawsByStatement` names them, in the
 * schema's statement order.
 *
 * `lawsByStatement` compiles the schema's law model, which takes seconds, so this is memoized by
 * the schema: {@link judgedLaws} and {@link containmentsOf} share one compile.
 */
const statementLawsOf = Fn.memoize((schema: typeof Qti) => {
  const lawsOfStatement = lawsByStatement(schema);

  return schema.statements.map((statement) => ({ laws: lawsOfStatement(statement), statement }));
});

/**
 * Every law a schema states that the host judges over rows (`#pantry/test/key-copies.ts`
 * `JudgedLaw`), in statement order, each named as grizzle's `lawsByStatement` names its statement's
 * law ({@link statedAs}).
 *
 * @param schema - The schema, `Qti`.
 * @returns The laws.
 */
export const judgedLaws: (schema: typeof Qti) => readonly JudgedLaw[] = Fn.memoize(
  (schema: typeof Qti): readonly JudgedLaw[] =>
    statementLawsOf(schema).flatMap(({ laws, statement }) =>
      judgedOf(statement).map((judged) => statedAs(judged, laws)),
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

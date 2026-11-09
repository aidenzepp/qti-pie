/**
 * What a test reads of the laws the tests' host judge judges (`#pantry/test/host-judge.ts`)
 * beyond the judge itself: each containment a relation is the source of, named as grizzle's
 * `lawsOf` names its statement's law ({@link containmentsOf}), and a check's installed name from
 * its law ({@link checkConstraintOf}).
 *
 * It reads grizzle's values, so the law oracle reaches it from none of its modules: the oracle is a
 * second implementation, and reads no value of grizzle's (`src/grammar/purity.test.ts`).
 */
import { constraintNameOf } from "@bjornpagen/grizzle";
import type { Law } from "@bjornpagen/grizzle";
import { Function as Fn } from "effect";
import { containmentsIn, statedAs } from "#pantry/test/host-judge.ts";
import type { Containment } from "#pantry/test/host-judge.ts";
import { schemaLawsOf, statementLawsOf } from "#pantry/import/refusal.ts";
import type { Qti } from "#pantry/qti/schema.ts";

/**
 * Read every containment the schema states from one relation (`containmentsIn` of
 * `#pantry/test/host-judge.ts`), so a test can judge rows by the schema's own statements, their
 * selections included. Each law is its statement's own, named as the host judge's `judgedLaws`
 * names it (its `statedAs`), so `src/import/refusal.ts`'s `lawNameOf` names it.
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
 * Each check a schema states, as `lawsOf` lists it, by its relation and declared name
 * (`JSON.stringify([relation, name])`): the index {@link checkConstraintOf} reads, built once per
 * schema.
 */
const checksOf = Fn.memoize(
  (schema: typeof Qti): ReadonlyMap<string, CheckLaw> =>
    new Map(
      schemaLawsOf(schema)
        .filter((law): law is CheckLaw => law.kind === "check")
        .map((law) => [JSON.stringify([law.relation, law.name]), law]),
    ),
);

/**
 * The name PostgreSQL holds a check under, which a direct SQL writer's refusal by it names
 * (SQLSTATE 23514): grizzle's `constraintNameOf(schema, law)` of the check the schema states on a
 * relation under a declared name, as `lawsOf` names it, a row check's CHECK constraint or a check
 * over a derived relation's triggers, so a test takes the name from the installation's own naming
 * and never spells it.
 *
 * Each call compiles the schema's law model, and the first another (`schemaLawsOf` of
 * `#pantry/import/refusal.ts`, then grizzle's `constraintNameOf`, which compiles on every call), so
 * a test calls this in its body, under its own timeout, never where a run without the lease loads
 * the file.
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

  return constraintNameOf(schema, law);
};

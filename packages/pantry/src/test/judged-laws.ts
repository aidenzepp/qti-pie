/**
 * What a test reads of the laws the tests' host judge judges (`#pantry/test/host-judge.ts`)
 * beyond the judge itself: each containment a relation is the source of, named as grizzle's
 * `lawsOf` names its statement's law ({@link containmentsOf}), and a check's installed name from
 * its law ({@link checkConstraintOf}).
 *
 * It reads grizzle's values, so the law oracle reaches it from none of its modules: the oracle is a
 * second implementation, and reads no value of grizzle's (`src/grammar/purity.test.ts`).
 */
import { Option } from "effect";
import { containmentsIn, statedAs } from "#pantry/test/host-judge.ts";
import type { Containment } from "#pantry/test/host-judge.ts";
import type { Qti } from "#pantry/qti/own.ts";
import { installedNameOf, statementLawsOf } from "#pantry/test/law-namer.ts";

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
 * The name PostgreSQL holds a check under, which a direct SQL writer's refusal by it names
 * (SQLSTATE 23514): grizzle's `constraintNamesOf(schema)` lookup of the check the schema states on
 * a relation under a declared name, a row check's CHECK constraint or a check over a derived
 * relation's triggers, so a test takes the name from the installation's own naming and never
 * spells it. It reads the schema's own (`installedNameOf` of `#pantry/test/law-namer.ts`), whose
 * lookup is bound once per schema and whose first read compiles the schema's law model, so a test
 * calls this in its body, under its own timeout, never where a run without the lease loads the
 * file.
 *
 * @param schema - The schema, `Qti`.
 * @param relation - The relation the check is declared on, by name.
 * @param name - The check's declared name.
 * @returns The installed name.
 * @throws {Error} When the schema states no check of that name on that relation: a defect of the
 *   test that asks, never of a document.
 */
export const checkConstraintOf = (schema: typeof Qti, relation: string, name: string): string =>
  Option.getOrThrowWith(
    installedNameOf(schema, { kind: "check", name, relation }),
    () =>
      new Error(
        `The schema states no check ${name} on ${relation}, so the installation holds no CHECK for it. Name a check the schema declares on that relation.`,
      ),
  );

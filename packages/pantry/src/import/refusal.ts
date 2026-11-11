/**
 * How a refusal by the database names its laws (plan W5, Q5.17; the W5 amendment's C22).
 *
 * A package is refused before any row exists, by the reader, the ZIP container or the codec, which
 * `#pantry/import/rules.ts` names with no schema, or by grizzle's `invariant-rejected` outcome,
 * which names every law merged into the PostgreSQL object that refused the write
 * ({@link refusalOf}). Each law keeps the rule of the guard or schema rule it replaces, so a
 * verdict reads as it did.
 *
 * - **Laws by name.** Every law the schema states has a name, the law oracle's (`src/test/oracle.ts`
 *   `LawName`) where the oracle states the law, with its rule and its spec source
 *   ({@link lawTable}). An outcome's law is named one way ({@link lawNameOf}): a check by its own
 *   name ({@link lawOfCheck}), and every other law by its id, the one the outcome carries
 *   (grizzle's `RefusedLaw.id`), in the committed dictionary (`#pantry/vocab/law-names.json`),
 *   which `src/test/law-names.ts` generates from the schema's own naming (`src/test/law-namer.ts`)
 *   and `law-names.committed.test.ts` holds to it, so naming a refusal builds no schema. The
 *   dictionary is keyed by the database's law, never a judge.
 * - **A refusal is what the database said.** A family's axis foreign key discharges the family and
 *   every containment and fold merged into it, and its violation names them all. The refusal
 *   carries how grizzle decided them, every law it named and the set of their rules
 *   ({@link rulesOf}), listed by one fixed order (`ruleOrder` of `#pantry/import/rules.ts`) for
 *   display. It singles out no law where grizzle's outcome does not, and reads no row of the
 *   import's.
 * - **Explanations are the outcome's.** {@link explain} writes each law as grizzle reports it, with
 *   its rule, and the witness grizzle gives, its key or none. There is no catalog of messages.
 */

import type { Law, Refused, Witness } from "@bjornpagen/grizzle";
import { Array as Arr, Formatter, Option, pipe, Predicate, Schema } from "effect";
import type { Types } from "effect";

import type { RefusedLaw } from "#pantry/package/refusal-origin.ts";

import { lawTable } from "#pantry/vocab/laws.ts";
import { ruleOrder, ImportRefused } from "#pantry/import/rules.ts";
import type { Rule } from "#pantry/import/rules.ts";
import lawNamesFile from "#pantry/vocab/law-names.json" with { type: "json" };

/**
 * The name of a law of {@link lawTable}.
 */
export type LawName = keyof typeof lawTable;

/**
 * Every law name, in the table's order.
 */
export const lawNames: readonly LawName[] = Object.keys(lawTable).filter((name): name is LawName =>
  Object.hasOwn(lawTable, name),
);

/**
 * Name the check that states a law: its name with each space an underscore, since grizzle's check
 * names are `[A-Za-z0-9_]` and no law name holds an underscore, so {@link lawOfCheck} inverts it.
 *
 * @param law - The law.
 * @returns The check's name.
 */
export const checkNameOf = (law: LawName): string => law.replaceAll(" ", "_");

/**
 * Read the law a check states from the check's name, as an `invariant-rejected` outcome reports it.
 *
 * @param name - The check's name.
 * @returns The law, or none for a name no law's check bears.
 */
export const lawOfCheck = (name: string): Option.Option<LawName> => {
  const law = name.replaceAll("_", " ");

  return Option.fromUndefinedOr(lawNames.find((known) => known === law));
};

/**
 * The object that refused a law, as the importer reads it: an installed constraint or domain, by
 * the name PostgreSQL holds it under, or a write statement or a generated column's NOT NULL, which
 * install no constraint of the law's. grizzle's `RefusingObject` is one, its name a branded text.
 */
export type RefusingBy =
  | { readonly kind: "constraint" | "domain"; readonly name: string }
  | { readonly kind: "notNull" | "statement" };

/**
 * One law of a refusal, as the importer names it: the law as the schema states it, its id, and the
 * object that refused it. The id is a LawId for a law of the theory or a text pattern, and a
 * GeneratedLawId for a generated field's law. grizzle's `RefusedLaw` is one, its id and installed
 * name branded texts; a test plants one with texts of its own.
 */
export interface RefusalLaw {
  readonly by: RefusingBy;
  readonly id: string;
  readonly law: Law;
}

/**
 * A refusal of laws, as the importer reads one: how grizzle decided them, and the laws, at least
 * one (grizzle's `Refused`).
 */
export interface RefusalOf {
  readonly kind: Refused["kind"];
  readonly laws: Arr.NonEmptyReadonlyArray<RefusalLaw>;
}

/**
 * What the dictionary tells of one installed law: its name in {@link lawTable}.
 */
const LawEntry = Schema.Struct({ name: Schema.String });

/**
 * The law-name dictionary's form, `#pantry/vocab/law-names.json`: each installed law the importer
 * names but a check, keyed by its id, the key a refused law carries (grizzle's `RefusedLaw.id`): a
 * law of the theory's and a text pattern's LawId, and a generated field's law's GeneratedLawId.
 *
 * `src/test/law-names.ts` generates it from the schema's own naming (`src/test/law-namer.ts`) and
 * the id grizzle's `lawIdsOf` gives each law, and `law-names.committed.test.ts` holds the
 * committed file to it and names every law of `lawsOf(Qti)` through both, so the dictionary is the
 * schema's naming, read without building the schema.
 */
export const LawNamesFileSchema = Schema.Struct({ laws: Schema.Record(Schema.String, LawEntry) });

/**
 * The law-name dictionary, decoded.
 */
export type LawNamesFile = typeof LawNamesFileSchema.Type;

/**
 * Read a name of {@link lawTable}.
 *
 * @param name - A name as the dictionary writes it.
 * @returns The law name, or none for a name the table lacks.
 */
const lawNamed = (name: string): Option.Option<LawName> =>
  Option.fromUndefinedOr(lawNames.find((known) => known === name));

/**
 * The namer of a law-name dictionary.
 */
export interface LawNamer {
  /**
   * Name a law an outcome refused.
   *
   * @param refused - The refused law: the law, its LawId and the object that refused it.
   * @returns Its name, or none for a law no row of the dictionary or of the tables states.
   */
  readonly nameOf: (refused: RefusalLaw) => Option.Option<LawName>;
}

/**
 * Build the namer of a law-name dictionary. A check is named by its own name ({@link lawOfCheck}),
 * since grizzle names a check by the name its statement declares; every other law by the
 * dictionary's entry of its id, which the outcome carries; and a law of a level above the login's,
 * such as a package-media law (`QtiMedia` of `#pantry/qti/media.ts`) refusing a write of a login
 * over `Qti`, as the law it wraps. Nothing reads the schema.
 *
 * @param file - The dictionary.
 * @returns Its namer.
 */
export const namerFrom = (file: LawNamesFile): LawNamer => {
  const nameOf = ({ id, law }: Pick<RefusalLaw, "id" | "law">): Option.Option<LawName> => {
    if (law.kind === "above") {
      return nameOf({ id, law: law.law });
    }

    return law.kind === "check"
      ? lawOfCheck(law.name)
      : Option.flatMap(Option.fromUndefinedOr(file.laws[id]), ({ name }) => lawNamed(name));
  };

  return { nameOf };
};

/**
 * The namer of the committed dictionary, `#pantry/vocab/law-names.json`, built once, when this
 * module loads. The file is trusted as its import types it: the typecheck holds its shape to
 * {@link LawNamesFile}, and `law-names.committed.test.ts` holds it to the one the schema
 * generates, so loading it decodes nothing, and a dictionary of a stale shape
 * still loads for its generator to replace.
 */
const committedNamer = namerFrom(lawNamesFile);

/**
 * Name a law an outcome over `Qti` refused, by the committed dictionary ({@link namerFrom}).
 *
 * @param refused - A law of an `invariant-rejected` outcome.
 * @returns Its name, or none for a law no row of the dictionary or of the tables states.
 */
export const lawNameOf = (refused: RefusalLaw): Option.Option<LawName> =>
  committedNamer.nameOf(refused);

/**
 * Read the name PostgreSQL holds the object that refused a law under, as the outcome names it
 * (grizzle's `RefusedLaw.by`), whatever the law's kind: a table's constraint, a CHECK, a key, a
 * foreign key or an exclusion constraint, or a domain's CHECK. A write statement and a rule over a
 * query's trigger raise the law under its identity and install no constraint for it, and grizzle
 * names a generated column's NOT NULL by its table and column alone, so a law they refused has
 * none.
 *
 * @param refused - A law of an `invariant-rejected` outcome.
 * @returns The refusing object's installed name, or none.
 * @see https://github.com/bjornpagen/grizzle/blob/eb56d58bb3191b6645f1334dc55f63c7a73c2dc4/packages/engine/src/types/changeset/changeset.ts#L1200-L1215
 */
export const installedNameOf = ({ by }: RefusalLaw): Option.Option<string> =>
  by.kind === "constraint" || by.kind === "domain" ? Option.some(by.name) : Option.none();

/**
 * The rule the law table gives a law: its name's row's ({@link lawNameOf}).
 *
 * @param law - A law as an `invariant-rejected` outcome names it.
 * @returns Its rule, or none for a law no row of the table states.
 */
const ruleOfLaw = (refused: RefusalLaw): Option.Option<Rule> =>
  Option.map(lawNameOf(refused), (name) => lawTable[name].rule);

/**
 * The rules a refusal that names `laws` is refused under: the rule of each law the table states,
 * each once, listed in {@link ruleOrder}.
 *
 * The laws are a set, and so are the rules: the laws' order and any repeat change nothing. No law
 * is singled out: grizzle's `some` and `first` say only that one or more of the laws broke, so the
 * refusal is under all of their rules, and a reader of the verdict reads them all. A law no row of
 * the table states carries no rule, and still prints its text in the refusal; the census in
 * `refusal.oracle.test.ts` keeps every law the schema states in the table.
 *
 * @param laws - The `laws` of an `invariant-rejected` outcome.
 * @returns The rules, none when no law of the set is in the table.
 */
export const rulesOf = (laws: readonly RefusalLaw[]): readonly Rule[] =>
  Arr.sort(Arr.dedupe(laws.flatMap((law) => Option.toArray(ruleOfLaw(law)))), ruleOrder);

/**
 * The explanation of a refusal: what broke, and where each of its laws is stated.
 */
export interface Explanation {
  /**
   * Each law, its rule and the law as grizzle reports it, and grizzle's witness: the key of the
   * stated row that broke it, or that the database names none.
   */
  readonly detail: string;
  /**
   * Each law's spec source, each once; none where the law table holds none of the laws.
   */
  readonly sources: readonly string[];
}

/**
 * Write a witness as an explanation names it.
 *
 * Grizzle names a violating row by its key fields alone, never another column: a key's, and a row
 * check's, a closed relation's check's, a contract's or a pattern's where the host judges a row the
 * ChangeSet states to break it. A foreign key, and a check no stated row breaks as the host judges
 * it, it names by none: its witness is `unreported` (README, "Errors and outcomes").
 *
 * @param witness - The refusal's witness.
 * @returns Where the row is, or that the database names none.
 */
const witnessText = (witness: Witness): string => {
  if (witness.kind === "unreported") {
    return "the database names no row: PostgreSQL reports a constraint it checks itself by the constraint alone";
  }

  const values = Object.entries(witness.values)
    .map(
      ([field, value]) => `${field}=${Predicate.isString(value) ? value : Formatter.format(value)}`,
    )
    .join(" ");

  return `at ${witness.relation} ${values}`;
};

/**
 * Explain a refusal from its laws and its witness, as a pure function: each law named with its rule
 * and shown as grizzle reports it (Effect's `Formatter.format`), the witness's row, and each law's
 * spec source in `sources`.
 *
 * @param laws - The `laws` of an `invariant-rejected` outcome.
 * @param witness - Its `witness`.
 * @returns The explanation.
 */
export const explain = (
  laws: Arr.NonEmptyReadonlyArray<RefusalLaw>,
  witness: Witness,
): Explanation => {
  const named = laws.map((refused) => ({ law: refused.law, name: lawNameOf(refused) }));
  const lawText = named
    .map(({ law, name }) =>
      Option.match(name, {
        onNone: () => `${Formatter.format(law)}, which no rule of the law table owns`,
        onSome: (held) => `${held} (rule ${lawTable[held].rule}): ${Formatter.format(law)}`,
      }),
    )
    .join("; ");
  const sources = Arr.dedupe(
    named.flatMap(({ name }) =>
      Option.toArray(name.pipe(Option.map((law) => lawTable[law].source))),
    ),
  );

  return { detail: `${lawText}, ${witnessText(witness)}`, sources };
};

/**
 * One law of a refusal as the refusal carries it: its display text, the installed name of the
 * object that refused it ({@link installedNameOf}), and the name and rule the law table gives it.
 *
 * @param law - A law of an `invariant-rejected` outcome.
 * @returns Its facts.
 */
const lawFactOf = (refused: RefusalLaw): typeof RefusedLaw.Type => {
  const fact: Types.Mutable<typeof RefusedLaw.Type> = { text: Formatter.format(refused.law) };
  const installed = installedNameOf(refused);
  if (Option.isSome(installed)) {
    fact.installed = installed.value;
  }

  const name = lawNameOf(refused);
  if (Option.isSome(name)) {
    fact.name = name.value;
    fact.rule = lawTable[name.value].rule;
  }

  return fact;
};

/**
 * Build the refusal of an `invariant-rejected` outcome from the outcome alone: how grizzle decided
 * its laws, each law's facts ({@link lawFactOf}) in the outcome's order, the set of their rules
 * ({@link rulesOf}), and its explanation ({@link explain}). It reads no row and judges no law, so
 * a `some` or `first` refusal stays as undecided as grizzle left it.
 *
 * A host-side key conflict, two facts of one key that grizzle refuses before any SQL, names its
 * key law and the submitted key as its witness, and is refused the same way, with no SQLSTATE.
 *
 * @param refused - The outcome's `refused`.
 * @param witness - Its `witness`.
 * @returns The refusal.
 */
export const refusalOf = (refused: RefusalOf, witness: Witness): ImportRefused => {
  const { detail, sources } = explain(refused.laws, witness);

  return new ImportRefused({
    detail,
    origin: {
      _tag: "Database",
      kind: refused.kind,
      laws: pipe(refused.laws, Arr.map(lawFactOf)),
      sources,
      witness: witness.kind,
    },
    rules: rulesOf(refused.laws),
  });
};

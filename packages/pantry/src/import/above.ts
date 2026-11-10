/**
 * The refusal of a write by a level above `Qti` (spec purity: "names `Qti` wherever pantry can
 * tell").
 *
 * A Db over a lower level holds none of the code of the levels above it, so grizzle reports a law
 * such a level states, a foreign key into its relations or a check of its own, as
 * `{ kind: "above", level, law }`, the law as that level states it. No such law is in pantry's law
 * table (`#pantry/import/refusal.ts`), so the table cannot name its rule: {@link aboveRefusalOf}
 * names the refusal by the level and the law's own name instead, as {@link RefusedAbove}.
 *
 * @see https://github.com/bjornpagen/grizzle/blob/6995af4da7d134108476d18ffbfabf7214b1b9a0/packages/engine/src/types/changeset/changeset.ts
 */
/* oxlint-disable unicorn/throw-new-error -- Schema.TaggedError is a schema class factory. */
import type { Law } from "@bjornpagen/grizzle";
import { Array as Arr, Formatter, Option, pipe, Schema } from "effect";
import type { RefusalWitness } from "#pantry/import/refusal.ts";
import { RefusalOrigin } from "#pantry/package/refusal-origin.ts";

/**
 * A law a level above the schema states, as an `invariant-rejected` outcome names it.
 */
type AboveLaw = Extract<Law, { readonly kind: "above" }>;

/**
 * The package was refused under a law a level above `Qti` states, so no rule of pantry's roster
 * names it.
 *
 * `level` is the level that states the law and `rule` the law's own name there; `detail` lists
 * every law the refusal named, and `origin` is the database's case, with each law's identity and
 * the level as the laws' one source. Nothing was written: the apply refused the whole package.
 */
export class RefusedAbove extends Schema.TaggedError<RefusedAbove>()("RefusedAbove", {
  detail: Schema.String,
  level: Schema.String,
  origin: RefusalOrigin,
  rule: Schema.String,
}) {
  /**
   * The level and rule that refused the package, what it named, and the repair.
   */
  override get message(): string {
    return `The package was refused under the ${this.rule} rule of the ${this.level} level, a level above Qti: ${this.detail}. Nothing was written. Fix what the ${this.level} level's ${this.rule} rule describes in the package, then import it again.`;
  }
}

/**
 * Test whether a law is one a level above the schema states.
 *
 * @param law - The law.
 * @returns Whether it is an `above` law.
 */
const isAbove = (law: Law): law is AboveLaw => law.kind === "above";

/**
 * Test whether every law of a refusal is one a level above the schema states.
 *
 * @param laws - The refusal's laws.
 * @returns Whether each is an `above` law.
 */
const allAbove = (
  laws: Arr.NonEmptyReadonlyArray<Law>,
): laws is Arr.NonEmptyReadonlyArray<AboveLaw> => laws.every(isAbove);

/**
 * Name an above law as its level states it: a check by its name, and any other law as grizzle
 * reports it (Effect's `Formatter.format`).
 *
 * @param above - The above law.
 * @returns The law's own name.
 */
const ruleOf = ({ law }: AboveLaw): string =>
  law.kind === "check" ? law.name : Formatter.format(law);

/**
 * Build the refusal of an `invariant-rejected` outcome when every law it names is stated by one
 * level above `Qti`.
 *
 * A set that holds any `Qti` law is left to the law table, whose rule names `Qti`, and so is a set
 * of laws of two levels, since no one level names it; both are none here.
 *
 * @param laws - The outcome's `laws`.
 * @param witness - Its `witness`, whose kind the refusal's origin keeps.
 * @returns The refusal, named by the level and its first law's own name, or none.
 */
export const aboveRefusalOf = (
  laws: Arr.NonEmptyReadonlyArray<Law>,
  witness: RefusalWitness,
): Option.Option<RefusedAbove> => {
  if (!allAbove(laws)) {
    return Option.none();
  }

  const [first, ...rest] = laws;

  if (rest.some(({ level }) => level !== first.level)) {
    return Option.none();
  }

  const { level } = first;

  return Option.some(
    new RefusedAbove({
      detail: laws.map((law) => `${ruleOf(law)}: ${Formatter.format(law.law)}`).join("; "),
      level,
      origin: {
        _tag: "Database",
        laws: pipe(
          laws,
          Arr.map((law) => ({ identity: Formatter.format(law) })),
        ),
        sources: [`the ${level} level, which states these laws above Qti`],
        witness: witness.kind,
      },
      rule: ruleOf(first),
    }),
  );
};

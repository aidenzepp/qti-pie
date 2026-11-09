/**
 * Where a refused import's refusal comes from, as a value both the importer and the command line
 * read: the reader, the container or the codec, which refuse a package before any row exists, or
 * the database, which names the laws its outcome refused the write under.
 *
 * The database's account is one case of {@link RefusalOrigin}, never four optional fields, so a
 * refusal either carries how grizzle decided its laws, the laws, their sources and its witness
 * together or carries none of them, and a reader switches on the case rather than testing each
 * field. The laws are read once, where `refusalOf` of `#pantry/import/refusal.ts` builds the
 * refusal from the outcome alone, into the facts every reader prints. The module imports Effect
 * alone, and it sits with the package's readers rather than the importer, so the command line reads
 * a refusal without loading the importer: its startup graph reaches no `#pantry/import/` module
 * (`src/cli/startup.test.ts`).
 */
import type { Refused } from "@bjornpagen/grizzle";
import { Schema } from "effect";
import type { RefusalWitness } from "#pantry/import/refusal.ts";

/**
 * The kinds of witness a database refusal names its row by, checked against the kinds of
 * `RefusalWitness` of `#pantry/import/refusal.ts` both ways: a kind it adds or drops fails to
 * compile here.
 */
const witnessKinds = {
  key: "key",
  row: "row",
  unreported: "unreported",
} as const satisfies { readonly [Kind in RefusalWitness["kind"]]: Kind };

/**
 * How a database refusal names the row that broke its laws: `key`, grizzle's key witness, the
 * violating row's key fields; `row`, a row the caller holds, with the fields beyond its key;
 * `unreported`, no row, for a foreign key or a law no stated row breaks as grizzle judges it.
 */
export const WitnessKind = Schema.Literals(Object.values(witnessKinds));

/**
 * The ways grizzle decides the laws an `invariant-rejected` outcome names, checked against the
 * kinds of its `Refused` both ways: a kind it adds or drops fails to compile here.
 */
const refusedKinds = {
  every: "every",
  first: "first",
  some: "some",
} as const satisfies { readonly [Kind in Refused["kind"]]: Kind };

/**
 * How grizzle decided the laws a database refusal names, as its outcome says (grizzle-engine
 * `types/changeset/changeset.ts` `Refused`, at the vendored commit): `every`, each law named is
 * broken; `first`, the laws of the CHECK PostgreSQL tried first, and the row may break others too;
 * `some`, at least one law named is broken, and nothing grizzle holds says which. A refusal reports
 * it as it is and never decides more than the outcome does.
 */
export const RefusedKind = Schema.Literals(Object.values(refusedKinds));

/**
 * One law a database refusal names: its `text`, the law as grizzle's outcome names it, written by
 * Effect's `Formatter.format` for a person to read; its `installed` name, the name PostgreSQL holds
 * a check's CHECK constraint under (grizzle's `constraintNameOf`), absent for every other kind of
 * law, which grizzle names no installed object of at the vendored commit; and the `name` and `rule`
 * the law table gives it, absent for a law the table does not hold. A program reads which law broke
 * by its `name`, or by its `installed` name where the table names none.
 *
 * The text is no JSON: `Formatter.format` writes a literal's absent type as `undefined` and a
 * bigint as `1n`. The law stays display text because grizzle has no encoder or decoder of its
 * `Law` or its IR, and will never have one, as its owner ruled on 2026-11-08: the database is the
 * whole constraint engine, so a refusal prints what the database states, each law's display text
 * and its installed name.
 */
export const RefusedLaw = Schema.Struct({
  installed: Schema.optionalKey(Schema.String),
  name: Schema.optionalKey(Schema.String),
  rule: Schema.optionalKey(Schema.String),
  text: Schema.String,
});

/**
 * Where a refusal comes from: `Reader`, the reader, the ZIP container, the package reader or the
 * codec, before any row exists; or `Database`, an `invariant-rejected` outcome, with how grizzle
 * decided its laws, every law it named, the source of every law the table holds (none where it
 * holds none of them) and its witness's kind.
 */
export const RefusalOrigin = Schema.Union([
  Schema.TaggedStruct("Reader", {}),
  Schema.TaggedStruct("Database", {
    kind: RefusedKind,
    laws: Schema.NonEmptyArray(RefusedLaw),
    sources: Schema.Array(Schema.String),
    witness: WitnessKind,
  }),
]);

/**
 * The origin of a refusal the reader, the container or the codec made.
 */
export const readerOrigin: typeof RefusalOrigin.Type = { _tag: "Reader" };

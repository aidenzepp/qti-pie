/**
 * Where a refused import's refusal comes from, as a value both the importer and the command line
 * read: the reader, the container or the codec, which refuse a package before any row exists, or
 * the database, which names the laws its outcome refused the write under.
 *
 * The database's account is one case of {@link RefusalOrigin}, never three optional fields, so a
 * refusal either carries its laws, their sources and its witness together or carries none of them,
 * and a reader switches on the case rather than testing each field. The laws are parsed once, where
 * `refusalOfLaws` of `#pantry/import/refusal.ts` builds the refusal, into the facts every reader
 * prints. The module imports Effect alone, and it sits with the package's readers rather than the
 * importer, so the command line reads a refusal without loading the importer: its startup graph
 * reaches no `#pantry/import/` module (`src/cli/startup.test.ts`).
 */
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
 * One law a database refusal names: its identity as grizzle reports the law, and the name and rule
 * the law table gives it, absent for a law the table does not hold.
 */
export const RefusedLaw = Schema.Struct({
  identity: Schema.String,
  name: Schema.optionalKey(Schema.String),
  rule: Schema.optionalKey(Schema.String),
});

/**
 * Where a refusal comes from: `Reader`, the reader, the ZIP container, the package reader or the
 * codec, before any row exists; or `Database`, an `invariant-rejected` outcome, with every law it
 * named, every law's source and its witness's kind.
 */
export const RefusalOrigin = Schema.Union([
  Schema.TaggedStruct("Reader", {}),
  Schema.TaggedStruct("Database", {
    laws: Schema.NonEmptyArray(RefusedLaw),
    sources: Schema.NonEmptyArray(Schema.String),
    witness: WitnessKind,
  }),
]);

/**
 * The origin of a refusal the reader, the container or the codec made.
 */
export const readerOrigin: typeof RefusalOrigin.Type = { _tag: "Reader" };

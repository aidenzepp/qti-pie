/**
 * What the command line prints of a refused import, read from the refusal's own fields and never
 * from its message: the rule it was refused under, and, when the database refused it, the laws the
 * outcome names, where each is stated and how the refusal names the row that broke them (plan W5,
 * Q5.18; the W5 amendment's C22).
 *
 * A refusal is matched by its tag and its fields, so this module imports neither the importer nor
 * the law table: the refusal carries its origin (`#pantry/package/refusal-origin.ts`), and a
 * database refusal's laws already parsed into the facts the command line prints.
 */
import { Option, Schema } from "effect";
import { RefusalOrigin } from "#pantry/package/refusal-origin.ts";

/**
 * The fields of an `ImportRefused` (`#pantry/import/refusal.ts`) the command line reads: its rule
 * and its origin, the reader's, the container's or the codec's, or the database's with the laws
 * grizzle's `invariant-rejected` outcome named, where each law is stated, and the kind of witness
 * that names the row that broke them.
 */
const ImportRefusedFields = Schema.Struct({
  _tag: Schema.Literal("ImportRefused"),
  origin: RefusalOrigin,
  rule: Schema.String,
});

/**
 * The fields of a failure that is a refused import, as {@link ImportRefusedFields} reads them.
 */
export type RefusalFields = typeof ImportRefusedFields.Type;

/**
 * Read the fields of a refused import, as {@link ImportRefusedFields} reads them, or none when the
 * failure is anything else.
 *
 * @param failure - What a run failed with.
 * @returns The refusal's rule, laws and sources.
 */
export const refusalFieldsOf: (
  // oxlint-disable-next-line anti-slop/no-unknown-parameters -- A failure can be any value, and this is the decode that parses it.
  failure: unknown,
) => Option.Option<RefusalFields> = Schema.decodeUnknownOption(ImportRefusedFields);

/**
 * The database's account of a refusal it gave: the laws its outcome named, their sources and its
 * witness's kind.
 */
export type DatabaseRefusal = Extract<RefusalFields["origin"], { readonly _tag: "Database" }>;

/**
 * Read the database's account of a refused import.
 *
 * @param fields - The refusal's fields.
 * @returns The database's account, none for a refusal the reader, the container or the codec made.
 */
export const databaseRefusalOf = (fields: RefusalFields): Option.Option<DatabaseRefusal> =>
  fields.origin._tag === "Database" ? Option.some(fields.origin) : Option.none();

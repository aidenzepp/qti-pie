/**
 * What the command line prints of a refused import, read from the refusal's own fields and never
 * from its message: the rule it was refused under, and, when the database refused it, the laws the
 * outcome names, where each is stated and how the refusal names the row that broke them (plan W5,
 * Q5.18; the W5 amendment's C22).
 *
 * A refusal is matched by its tag and its fields, so this module imports neither the importer nor
 * the law table at startup. The laws are named by the law table (`#pantry/import/refusal.ts`),
 * which is loaded only to print a refusal the database gave, and which is loaded by then: the
 * refusal's own class lives there.
 */
import type { Law } from "@bjornpagen/grizzle";
import { Effect, Option, Predicate, Schema } from "effect";
import { ErrorWitness } from "#pantry/cli/output.ts";
import type { LawFact } from "#pantry/cli/output.ts";

/**
 * The fields of an `ImportRefused` (`#pantry/import/refusal.ts`) the command line reads: its rule,
 * the laws grizzle's `invariant-rejected` outcome named, where each law is stated, and the kind of
 * witness that names the row that broke them. The laws, the sources and the witness are present
 * exactly when the database refused the package; the reader, the container and the codec give
 * none of them.
 */
const ImportRefusedFields = Schema.Struct({
  _tag: Schema.Literal("ImportRefused"),
  laws: Schema.optional(Schema.Array(Schema.Unknown)),
  rule: Schema.String,
  sources: Schema.optional(Schema.Array(Schema.String)),
  witness: Schema.optional(ErrorWitness),
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
 * Whether a refused import was refused by the database: its outcome named at least one law.
 *
 * @param fields - The refusal's fields.
 * @returns Whether it carries laws.
 */
export const refusedByDatabase = (fields: RefusalFields): boolean =>
  fields.laws !== undefined && fields.laws.length > 0;

/**
 * Every kind of law grizzle's outcome names (its `Law` union), checked against that union both
 * ways, so a kind grizzle adds or drops fails to compile here.
 */
const lawKinds = {
  check: true,
  contained: true,
  contract: true,
  coverage: true,
  family: true,
  fold: true,
  generated: true,
  key: true,
  pattern: true,
  primaryKey: true,
  tree: true,
} as const satisfies Readonly<Record<Law["kind"], true>>;

/**
 * Whether a value of a refusal's `laws` is one of grizzle's laws.
 *
 * The field is typed unknown because grizzle's `Law` has no schema, and only `refusalOfLaws` fills
 * it, with the outcome's laws as grizzle gave them. So a law is told by its kind alone, which is
 * what chooses the shape the law table reads.
 */
// oxlint-disable-next-line anti-slop/no-unknown-parameters -- The refusal's field is typed unknown; this is the check that narrows it.
const isLaw = (value: unknown): value is Law =>
  Predicate.hasProperty(value, "kind") &&
  Predicate.isString(value.kind) &&
  Object.hasOwn(lawKinds, value.kind);

/**
 * Name each law a database refusal carries, by the law table: its identity, and its name and rule
 * when the table holds it.
 *
 * @param fields - The refusal's fields.
 * @returns One fact per law, in the outcome's order; none for a refusal the database did not
 * give.
 */
export const lawFactsOf = Effect.fnUntraced(function* lawFactsOf(
  fields: RefusalFields,
): Effect.fn.Return<Option.Option<readonly LawFact[]>> {
  if (!refusedByDatabase(fields)) {
    return Option.none();
  }

  const { lawIdentity, lawNameOf, lawTable } = yield* Effect.promise(
    () => import("#pantry/import/refusal.ts"),
  );

  return Option.some(
    (fields.laws ?? []).filter(isLaw).map((law): LawFact => {
      const identity = lawIdentity(law);

      return Option.match(lawNameOf(law), {
        onNone: () => ({ identity }),
        onSome: (name) => ({ identity, name, rule: lawTable[name].rule }),
      });
    }),
  );
});

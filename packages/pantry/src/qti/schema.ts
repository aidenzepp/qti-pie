/**
 * The `Qti` schema: its stored level, `QtiBase` (`#pantry/qti/base.ts`), every roster, closed
 * relation and stored relation with the laws over them, and over it the level `QtiQueries`, which
 * names the queries its rules read, with those rules (`#pantry/qti/queries.ts`). The two levels are
 * one installation, under the stored level's name: grizzle installs each level in a PostgreSQL
 * schema of its own, the stored level's holding every table, and judges a rule over a query by
 * deferred triggers on the tables below it (README, "Levels").
 *
 * Every reader of the schema, the author role, its login and the importer among them, reads `Qti`,
 * the top level, so a refusal by a rule over a query is its own law, never a law of a level above.
 * An application that adds laws or relations of its own stacks its level over `Qti` with grizzle's
 * `schema.extend`, as `#pantry/qti/media.ts` does for the package-media laws.
 */
import { schema } from "@bjornpagen/grizzle";
import { QtiBase } from "#pantry/qti/base.ts";
import { queryLaws, queryRelations } from "#pantry/qti/queries.ts";

/**
 * The QTI 3.0 schema: every relation of `QtiBase` and every query of `QtiQueries`, each public and
 * typed under `Qti.relations`, and every law over them.
 */
export const Qti = schema.extend(QtiBase, "QtiQueries", queryRelations, queryLaws);

/**
 * The QTI 3.0 schema's type, the type of {@link Qti}.
 */
export type QtiSchema = typeof Qti;

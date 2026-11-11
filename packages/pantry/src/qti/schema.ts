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
import type { Option } from "effect";
import { QtiBase } from "#pantry/qti/base.ts";
import { queryLaws, queryLawsByName, queryRelations } from "#pantry/qti/queries.ts";

/**
 * The QTI 3.0 schema: every relation of `QtiBase` and every query of `QtiQueries`, each public and
 * typed under `Qti.relations`, and every law over them.
 */
export const Qti = schema.extend(QtiBase, "QtiQueries", queryRelations, queryLaws);

/**
 * The QTI 3.0 schema's type, the type of {@link Qti}.
 */
export type QtiSchema = typeof Qti;

/**
 * {@link Qti}, under the name earlier installs called to build it for a policy. `Qti` takes no
 * policy now: an install with a package-media policy stacks `QtiMedia` (`#pantry/qti/media.ts`)
 * over it and writes its policy as `MediaType` rows, so this takes none, and a call with a policy
 * is a type error that names the port.
 *
 * @param _policy - None: `Qti` holds no policy, and no value is an `Option<never>` but none.
 * @returns {@link Qti} .
 */
export const qtiSchema = (_policy: Option.Option<never>): QtiSchema => Qti;

/**
 * {@link Qti}'s levels and the groups of its rules over queries by law, under the name earlier
 * installs called to build them for a policy: the stored level (`base`), the schema (`qti`) and the
 * groups (`lawsByName`). Like {@link qtiSchema}, it takes no policy.
 *
 * @param _policy - None: `Qti` holds no policy, and no value is an `Option<never>` but none.
 * @returns The levels and the groups.
 */
export const qtiLevelsOf = (_policy: Option.Option<never>) => ({
  base: QtiBase,
  lawsByName: queryLawsByName,
  qti: Qti,
});

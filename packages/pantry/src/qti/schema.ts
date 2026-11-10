/**
 * The `Qti` schema: its stored level, `QtiBase` (`#pantry/qti/base.ts`), every roster, closed
 * relation and stored relation with the laws over them, and over it the level that names the
 * queries its rules read, with those rules (`#pantry/qti/queries.ts`). The two levels are one
 * installation, under the stored level's name: grizzle installs each level in a PostgreSQL schema
 * of its own, the stored level's holding every table, and judges a rule over a query by deferred
 * triggers on the tables below it (README, "Levels").
 *
 * Every reader of the schema, the author role, its login and the importer among them, reads `Qti`,
 * the top level, so a refusal by a rule over a query is its own law, never a law of a level above.
 *
 * Loading this module builds no schema: it exports the builders, and each call builds its own,
 * which its caller holds. This package's own install holds its one in `#pantry/qti/own.ts`, and an
 * install outside it builds and holds its own for its policy.
 */
import { schema } from "@bjornpagen/grizzle";
import type { Option } from "effect";
import type { MediaPolicy } from "#pantry/db/install.ts";
import { qtiBaseOf } from "#pantry/qti/base.ts";
import { mediaLawsByName, mediaQueriesOf } from "#pantry/qti/media.ts";
import { queriesOf } from "#pantry/qti/queries.ts";

/**
 * Build the QTI 3.0 schema's levels for an install's policy, or none for this package's own
 * install: the stored level, every module's relations and laws and the policy's package-media laws
 * over its tables (`#pantry/qti/media.ts`); over it the level `QtiQueries`, every query and every
 * rule over one, each defined over that stored level, the policy's rule over a query last; and the
 * groups of the statements this call built, the policy's and the queries', by the law each states,
 * which the schema's own naming of its laws reads (`#pantry/test/law-namer.ts` `namedLaws`, the
 * source of the committed law-name dictionary), since it knows a statement by its identity.
 *
 * Each call builds its own schema, statements and queries: one install builds once and holds the
 * result.
 *
 * @param policy - The install's policy, none for this package's own install.
 * @returns The stored level (`base`), the schema (`qti`) and the groups of the statements built
 *   with it (`lawsByName`).
 */
export const qtiLevelsOf = (policy: Option.Option<MediaPolicy>) => {
  const media = mediaLawsByName(policy);
  const base = qtiBaseOf(Object.values(media).flat());
  const queries = queriesOf(base);
  const mediaQueries = mediaQueriesOf(policy, base);

  return {
    base,
    lawsByName: [media, ...queries.lawsByName, mediaQueries.lawsByName] as const,
    qti: schema.extend(base, "QtiQueries", { ...queries.relations, ...mediaQueries.relations }, [
      ...queries.laws,
      ...Object.values(mediaQueries.lawsByName).flat(),
    ]),
  };
};

/**
 * Build the QTI 3.0 schema for an install's policy, or none for this package's own install
 * ({@link qtiLevelsOf}): each call its own, which the install holds.
 *
 * @param policy - The install's policy, none for this package's own install.
 * @returns The schema.
 */
export const qtiSchema = (policy: Option.Option<MediaPolicy>) => qtiLevelsOf(policy).qti;

/**
 * The QTI 3.0 schema, whatever policy built it: what the author role, its login and the export's
 * reads are built over.
 */
export type QtiSchema = ReturnType<typeof qtiSchema>;
